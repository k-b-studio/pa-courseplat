import { teachableOfferings } from '$lib/server/offerings';
import { semesters } from '$lib/server/student';
import type { PageServerLoad } from './$types';

/** spec 05 R1: my offerings in the upcoming and active semesters (staff: all, with a filter). */
export const load: PageServerLoad = async ({ locals }) => {
	const sb = locals.supabase;
	const all = await semesters(sb);
	const current = all.filter((s) => s.status === 'upcoming' || s.status === 'active');
	const groups = await Promise.all(current.map(async (s) => ({ semester: s, offerings: await teachableOfferings(sb, locals.profile!, s.id) })));
	// R13: an import keeps running if the user leaves; its result shows up here
	const ids = groups.flatMap((g) => g.offerings.map((o) => o.id));
	const { data: xs } = ids.length
		? await sb.from('extractions').select('id, offering_id, status, created_at').in('offering_id', ids).eq('created_by', locals.profile!.id).order('created_at', { ascending: false })
		: { data: [] };
	const imports: Record<string, { id: string; status: string }> = {};
	for (const x of (xs ?? []) as { id: string; offering_id: string; status: string }[]) imports[x.offering_id] ??= { id: x.id, status: x.status };
	// open cautions by severity, each count linking to the dashboard filtered to that offering (spec 05 R1)
	const { data: cs } = ids.length ? await sb.from('content_cautions').select('a_offering_id, b_offering_id, severity').eq('status', 'open').in('severity', ['high', 'medium']) : { data: [] };
	const cautionCounts: Record<string, { high: number; medium: number }> = {};
	for (const c of (cs ?? []) as { a_offering_id: string; b_offering_id: string; severity: 'high' | 'medium' }[])
		for (const o of [c.a_offering_id, c.b_offering_id]) if (ids.includes(o)) (cautionCounts[o] ??= { high: 0, medium: 0 })[c.severity]++;
	// today in Bangkok, for "days left" before the syllabus due date
	const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
	return { groups, today, imports, cautionCounts, isStaff: locals.profile!.role === 'staff' };
};
