import { redirect } from '@sveltejs/kit';
import { cautionBadge } from '$lib/server/cautions/view';
import type { LayoutServerLoad } from './$types';

// hooks.server.ts gates every (app) request first; this is the per-route re-check (spec 03 R7)
export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user || !locals.profile) redirect(303, '/');
	// spec 06 R9: instructors see new cautions that someone else's run created on their offerings
	const badge = locals.profile.role === 'instructor' ? await cautionBadge(locals.supabase, locals.profile.id, locals.profile.cautions_seen_at) : 0;
	return { profile: locals.profile, cautionBadge: badge };
};
