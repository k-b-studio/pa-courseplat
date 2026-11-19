import { fail, redirect } from '@sveltejs/kit';
import { homeRouteFor } from '$lib/domain/accounts';
import type { Actions, PageServerLoad } from './$types';
import { appPath } from '$lib/paths';
import { browserOrigin } from '$lib/server/portal';

export const load: PageServerLoad = async ({ locals }) => {
	// signed-in people go straight to their area
	if (locals.user && locals.profile) redirect(303, appPath(homeRouteFor(locals.profile)));
	return {};
};

export const actions: Actions = {
	/** Google OAuth (spec 03 R1). No `hd` hint: students and staff use two domains; the hook is the gate. */
	google: async ({ locals, request, url }) => {
		const { data, error } = await locals.supabase.auth.signInWithOAuth({
			provider: 'google',
			// always explicit: the shared project's Site URL belongs to creditGPAX (spec 02 rule 7). Back to the
			// origin the browser used (kbstudio.space behind the portal rewrite), where the PKCE cookie lives.
			options: { redirectTo: `${browserOrigin(request, url)}${appPath('/auth/callback')}` }
		});
		if (error || !data.url) return fail(500, { error: 'oauth' });
		redirect(303, data.url);
	}
};
