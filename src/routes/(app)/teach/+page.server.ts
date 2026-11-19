import { teachableOfferings } from '$lib/server/offerings';
import { semesters } from '$lib/server/student';
import type { PageServerLoad } from './$types';

/** spec 05 R1: my offerings in the upcoming and active semesters (staff: all, with a filter). */
export const load: PageServerLoad = async ({ locals }) => {
	const sb = locals.supabase;
	const all = await semesters(sb);
	const current = all.filter((s) => s.status === 'upcoming' || s.status === 'active');
	const groups = await Promise.all(current.map(async (s) => ({ semester: s, offerings: await teachableOfferings(sb, locals.profile!, s.id) })));
	// today in Bangkok, for "days left" before the syllabus due date
	const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
	return { groups, today, isStaff: locals.profile!.role === 'staff' };
};
