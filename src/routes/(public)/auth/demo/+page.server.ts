import { redirect } from '@sveltejs/kit';
import { homeRouteFor } from '$lib/domain/accounts';
import { requireDemoMode, signInDemo } from '$lib/server/demo';
import type { Profile } from '$lib/types';
import type { Actions, PageServerLoad } from './$types';
import { appPath } from '$lib/paths';

export const load: PageServerLoad = async () => {
	requireDemoMode();
	redirect(303, appPath('/'));
};

export const actions: Actions = {
	/** Also used by the header's "สลับบัญชีตัวอย่าง" menu: sign out, then in as another demo account. */
	default: async ({ request, locals }) => {
		requireDemoMode();
		const key = String((await request.formData()).get('key') ?? '');
		const res = await signInDemo(locals.supabase, key);
		if (!res.ok) redirect(303, appPath('/auth/error?reason=demo'));
		const { data, error } = await locals.supabase.rpc('ensure_profile');
		if (error || !data) redirect(303, appPath('/auth/error?reason=profile'));
		redirect(303, appPath(homeRouteFor(data as Profile)));
	}
};
