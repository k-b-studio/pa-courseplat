/** OAuth return (spec 03 flow): exchange the code, create the profile, send the person to their area. */
import { redirect } from '@sveltejs/kit';
import { homeRouteFor } from '$lib/domain/accounts';
import type { Profile } from '$lib/types';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const err = url.searchParams.get('error');
	if (err) {
		const desc = url.searchParams.get('error_description') ?? '';
		// the shared sign-up hook refuses with 403 "Accounts are for Chula PolSci students and Chula staff only"
		const refused = /PolSci|Accounts are for|signups? not allowed/i.test(desc) || url.searchParams.get('error_code') === 'signup_disabled';
		redirect(303, `/auth/error?reason=${refused ? 'refused' : err === 'access_denied' ? 'cancelled' : 'generic'}`);
	}

	const code = url.searchParams.get('code');
	if (!code) redirect(303, '/auth/error?reason=generic');
	const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
	if (error) redirect(303, '/auth/error?reason=generic');

	const { data, error: pe } = await locals.supabase.rpc('ensure_profile');
	if (pe || !data) redirect(303, '/auth/error?reason=profile');
	redirect(303, homeRouteFor(data as Profile));
};
