/** Offering queries shared by the teaching pages. All run as the signed-in user (RLS applies). */
import type { Profile } from '$lib/types';

// never select offerings.syllabus here: students and plain selects can't (column privileges)
export const OFFERING_COLUMNS = 'id, course_code, semester_id, status, coordinator_id, updated_at, published_at, course:courses(name_th, name_en)';

export type OfferingRow = {
	id: string;
	course_code: string;
	semester_id: string;
	status: 'not_started' | 'draft' | 'published';
	coordinator_id: string | null;
	updated_at: string | null;
	published_at: string | null;
	course: { name_th: string; name_en: string } | null;
};

export async function upcomingSemester(sb: App.Locals['supabase']) {
	const { data } = await sb.from('semesters').select('id, label, status, starts_on, syllabus_due_on').eq('status', 'upcoming').maybeSingle();
	return data as { id: string; label: string; status: string; starts_on: string; syllabus_due_on: string | null } | null;
}

/** Offerings this person may edit in a semester: staff all; instructors coordinator or section instructor (spec 03 R5). */
export async function teachableOfferings(sb: App.Locals['supabase'], profile: Profile, semesterId: string): Promise<OfferingRow[]> {
	let q = sb.from('offerings').select(OFFERING_COLUMNS).eq('semester_id', semesterId).order('course_code');
	if (profile.role !== 'staff') {
		const { data: mine } = await sb.from('section_instructors').select('section:sections(offering_id)').eq('profile_id', profile.id);
		const ids = new Set<string>((mine ?? []).map((r: any) => r.section?.offering_id).filter(Boolean));
		const { data: coord } = await sb.from('offerings').select('id').eq('coordinator_id', profile.id);
		for (const r of coord ?? []) ids.add(r.id);
		if (!ids.size) return [];
		q = q.in('id', [...ids]);
	}
	const { data } = await q;
	return (data ?? []) as unknown as OfferingRow[];
}
