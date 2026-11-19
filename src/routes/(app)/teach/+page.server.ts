import { teachableOfferings, upcomingSemester } from '$lib/server/offerings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const semester = await upcomingSemester(locals.supabase);
	const offerings = semester ? await teachableOfferings(locals.supabase, locals.profile!, semester.id) : [];
	return { semester, offerings };
};
