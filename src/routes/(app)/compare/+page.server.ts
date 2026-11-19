import type { SyllabusDoc } from '$lib/schema/syllabus';
import { catalogAndRows } from '$lib/server/course-page';
import { publishedDocs, sectionsFor, semesters } from '$lib/server/student';
import type { CourseInfo, Semester, SectionView } from '$lib/view-types';
import type { PageServerLoad } from './$types';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type Column = { offeringId: string; course: CourseInfo; semester: Semester; doc: SyllabusDoc; sections: SectionView[] };

/** /compare?o=a,b[,c] — published snapshots only (spec 04 R3). */
export const load: PageServerLoad = async ({ url, locals }) => {
	const sb = locals.supabase;
	const ids = [...new Set((url.searchParams.get('o') ?? '').split(',').filter((x) => UUID.test(x)))].slice(0, 3);
	if (!ids.length) return { columns: [] as Column[] };
	const { data } = await sb.from('offerings').select('id, course_code, semester_id, status, published_revision').in('id', ids).eq('status', 'published');
	const offs = (data ?? []) as { id: string; course_code: string; semester_id: string; published_revision: number | null }[];
	const [docs, sections, { catalog }, all] = await Promise.all([publishedDocs(sb, offs), sectionsFor(sb, offs.map((o) => o.id)), catalogAndRows(sb), semesters(sb)]);
	const columns: Column[] = ids
		.map((id) => offs.find((o) => o.id === id))
		.filter((o): o is (typeof offs)[number] => !!o && docs.has(o.id))
		.map((o) => ({
			offeringId: o.id,
			course: catalog.get(o.course_code.trim())!,
			semester: all.find((s) => s.id === o.semester_id)!,
			doc: docs.get(o.id)!.doc,
			sections: sections.get(o.id) ?? []
		}));
	return { columns };
};
