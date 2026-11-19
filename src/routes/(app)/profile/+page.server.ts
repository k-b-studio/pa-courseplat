import { fail, redirect } from '@sveltejs/kit';
import { setFlash } from '$lib/server/flash';
import { saveMyProfile } from '$lib/server/profile';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, locals, cookies }) => {
		const res = await saveMyProfile(locals.supabase, locals.profile!, await request.formData());
		if (!res.ok) return fail(400, { error: true });
		setFlash(cookies, 'saved');
		redirect(303, '/profile');
	}
};
