/**
 * Per-request Supabase client, validated session, profile, and the role gate (spec 03 R7).
 * The gate runs here, before any load or form action, so no (app) route — page, action or
 * endpoint — can be reached without a session and the right role. Postgres RLS and the
 * security definer functions remain the real permission check; this is the server re-check.
 */
import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { canTeach, homeRouteFor, isStaffRole } from '$lib/domain/accounts';
import { appPath } from '$lib/paths';
import { setFlash } from '$lib/server/flash';
import type { Profile } from '$lib/types';

/** our cookies stay under our own path: kbstudio.space hosts other apps (one on the same Supabase project) */
const COOKIE_PATH = appPath('/');

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<any, 'courseplat'>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		db: { schema: 'courseplat' },
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookies, headers) => {
				for (const { name, value, options } of cookies) event.cookies.set(name, value, { ...options, path: COOKIE_PATH });
				// auth responses must never be cached (one user's token served to another)
				try {
					if (Object.keys(headers).length) event.setHeaders(headers);
				} catch {
					/* headers already set for this response */
				}
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error || !user) return { session: null, user: null };
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;
	event.locals.profile = user ? await loadProfile(event.locals.supabase, user.id) : null;

	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};

/** The profile row, created on first sign-in by ensure_profile() (no trigger on auth.users: spec 02 rule 4). */
async function loadProfile(sb: App.Locals['supabase'], id: string): Promise<Profile | null> {
	const { data } = await sb.from('profiles').select('*').eq('id', id).maybeSingle();
	if (data) return data as Profile;
	const created = await sb.rpc('ensure_profile');
	return created.error ? null : (created.data as Profile);
}

const gate: Handle = async ({ event, resolve }) => {
	const routeId = event.route.id ?? '';
	if (!routeId.startsWith('/(app)')) return resolve(event);

	const { user, profile } = event.locals;
	if (!user) redirect(303, appPath('/'));
	if (!profile) redirect(303, appPath('/auth/error?reason=profile'));

	// the route tree path without (groups): independent of the base path and the trailing slash
	const path = routeId.replace(/\/\([^)]+\)/g, '') || '/';
	const area = (prefix: string) => path === prefix || path.startsWith(prefix + '/');
	if ((area('/teach') || area('/cautions')) && !canTeach(profile.role)) {
		setFlash(event.cookies, 'wrongRole');
		redirect(303, appPath(homeRouteFor(profile)));
	}
	if (area('/admin') && !isStaffRole(profile.role)) {
		setFlash(event.cookies, 'staffOnly');
		redirect(303, appPath(homeRouteFor(profile)));
	}
	// students choose a major once before anything else (spec 03 R6)
	if (profile.role === 'student' && !profile.major && !area('/onboarding')) redirect(303, appPath('/onboarding'));

	return resolve(event);
};

export const handle = sequence(supabase, gate);
