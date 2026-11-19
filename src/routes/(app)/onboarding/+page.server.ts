import { fail, redirect } from '@sveltejs/kit';
import { homeRouteFor } from '$lib/domain/accounts';
import { saveMyProfile } from '$lib/server/profile';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const p = locals.profile!;
	if (p.role !== 'student' || p.major) redirect(303, homeRouteFor(p));
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const p = locals.profile!;
		if (p.role !== 'student') redirect(303, homeRouteFor(p));
		const res = await saveMyProfile(locals.supabase, p, await request.formData());
		if (!res.ok) return fail(400, { error: true });
		redirect(303, '/courses');
	}
};
