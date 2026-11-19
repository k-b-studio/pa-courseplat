import { error } from '@sveltejs/kit';
import { t } from '$lib/i18n/th';
import type { SyllabusDoc } from '$lib/schema/syllabus';
import { badgesFor, catalogAndRows, instructorsFor, plosMap, related, snapshotSections } from '$lib/server/course-page';
import { courseVersions, semesters } from '$lib/server/student';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A past published version, read-only, rendered from its own snapshot (spec 04 R2). */
export const load: PageServerLoad = async ({ params, locals }) => {
	if (!/^\d{7}$/.test(params.code) || !UUID.test(params.versionId)) error(404, t.common.notFound);
	const sb = locals.supabase;
	const { data: v } = await sb.from('offering_versions').select('id, offering_id, syllabus, sections_snapshot, published_at').eq('id', params.versionId).maybeSingle();
	if (!v) error(404, t.common.notFound);
	const versions = await courseVersions(sb, params.code);
	const own = versions.find((x) => x.id === v.offering_id);
	if (!own) error(404, t.common.notFound); // not a published offering of this course
	const [{ catalog, rows }, all, plos] = await Promise.all([catalogAndRows(sb), semesters(sb), plosMap(sb)]);
	const course = catalog.get(params.code)!;
	const semester = all.find((s) => s.id === own.semester_id)!;
	const sections = snapshotSections(v.sections_snapshot);
	const instructors = await instructorsFor(sb, sections);
	return {
		course,
		semester,
		doc: v.syllabus as SyllabusDoc,
		publishedAt: v.published_at as string,
		sections,
		instructors,
		plos,
		badges: await badgesFor(sb, locals.profile!, course, rows),
		related: related(catalog, course),
		past: versions.filter((x) => x.versionId && x.versionId !== v.id).map((x) => ({ versionId: x.versionId!, label: x.semester.label }))
	};
};
