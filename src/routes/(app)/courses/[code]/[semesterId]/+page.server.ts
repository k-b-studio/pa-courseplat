import { error } from '@sveltejs/kit';
import { t } from '$lib/i18n/th';
import { badgesFor, catalogAndRows, instructorsFor, plosMap, related } from '$lib/server/course-page';
import { courseVersions, listing, publishedDocs, sectionsFor, semesters } from '$lib/server/student';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!/^\d{7}$/.test(params.code)) error(404, t.common.notFound);
	const sb = locals.supabase;
	const [{ catalog, rows }, all, list, versions] = await Promise.all([catalogAndRows(sb), semesters(sb), listing(sb, params.semesterId), courseVersions(sb, params.code)]);
	const course = catalog.get(params.code);
	const semester = all.find((s) => s.id === params.semesterId);
	if (!course || !semester) error(404, t.common.notFound);

	const badges = await badgesFor(sb, locals.profile!, course, rows);
	const past = versions.filter((v) => v.semester_id !== semester.id && v.versionId).map((v) => ({ versionId: v.versionId!, semesterId: v.semester_id, label: v.semester.label }));
	const base = { course, semester, badges, past, related: related(catalog, course), semesters: all.map((s) => ({ id: s.id, label: s.label })) };

	if (!list.some((e) => e.course_code === course.code)) return { ...base, state: 'not_offered' as const };

	// students can only ever read the published snapshot; a draft is "not published yet" (spec 04 AC 9)
	const { data: off } = await sb.from('offerings').select('id, status, published_revision').eq('course_code', course.code).eq('semester_id', semester.id).maybeSingle();
	const doc = off && off.status === 'published' ? (await publishedDocs(sb, [off])).get(off.id) : undefined;
	if (!off || !doc) return { ...base, state: 'unpublished' as const, lastPublished: past[0] ?? null };

	const sections = (await sectionsFor(sb, [off.id])).get(off.id) ?? [];
	const [instructors, plos] = await Promise.all([instructorsFor(sb, sections), plosMap(sb)]);
	return { ...base, state: 'published' as const, offeringId: off.id, doc: doc.doc, publishedAt: doc.published_at, sections, instructors, plos };
};
