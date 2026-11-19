import { error } from '@sveltejs/kit';
import { curriculumFor, TRACKS, type CurriculumId } from '$lib/domain/curriculum';
import { t } from '$lib/i18n/th';
import { catalogAndRows } from '$lib/server/course-page';
import { defaultSemester, listing, semesters } from '$lib/server/student';
import type { PageServerLoad } from './$types';

const PA_PLOS = ['PLO1D', 'PLO2D', 'PLO3D', 'PLO4D', 'PLO5D'];

/** Curriculum map (spec 04 R4, Should): official PLO examples (●) and published CLO coverage (◐). */
export const load: PageServerLoad = async ({ locals, url }) => {
	const sb = locals.supabase;
	const profile = locals.profile!;
	const all = await semesters(sb);
	const asked = url.searchParams.get('semester');
	const semester = (asked && all.find((s) => s.id === asked)) || (await defaultSemester(sb, all));
	if (!semester) error(404, t.common.notFound);

	const [{ catalog, rows }, list, plosRes, cpRes, offRes] = await Promise.all([
		catalogAndRows(sb),
		listing(sb, semester.id),
		sb.from('plos').select('code, text_th').in('code', PA_PLOS),
		sb.from('course_plos').select('course_code, plo_code'),
		sb.from('offerings').select('id, course_code, published_revision').eq('semester_id', semester.id).eq('status', 'published')
	]);
	const published = ((offRes.data ?? []) as { id: string; course_code: string; published_revision: number }[]).map((o) => ({ ...o, course_code: o.course_code.trim() }));
	const { data: vs } = published.length
		? await sb.from('offering_versions').select('offering_id, revision, objectives:syllabus->objectives').in('offering_id', published.map((o) => o.id))
		: { data: [] };
	const covered = new Set<string>();
	for (const v of (vs ?? []) as { offering_id: string; revision: number; objectives: { ploCodes: string[] }[] }[]) {
		const o = published.find((x) => x.id === v.offering_id);
		if (!o || o.published_revision !== v.revision) continue;
		for (const obj of v.objectives ?? []) for (const p of obj.ploCodes ?? []) covered.add(`${o.course_code}|${p}`);
	}
	const official = new Set(((cpRes.data ?? []) as { course_code: string; plo_code: string }[]).map((r) => `${r.course_code.trim()}|${r.plo_code}`));
	const paCourses = [...catalog.values()].filter((c) => c.managed_here && c.department === 'PA').sort((a, b) => a.code.localeCompare(b.code));
	const statusIn = (code: string) => (published.some((o) => o.course_code === code) ? 'published' : (list.find((e) => e.course_code === code)?.status ?? null));

	const matrix = paCourses.map((c) => ({
		code: c.code,
		name_th: c.name_th,
		status: statusIn(c.code),
		cells: PA_PLOS.map((p) => ({ official: official.has(`${c.code}|${p}`), covered: covered.has(`${c.code}|${p}`) }))
	}));
	const footers = PA_PLOS.map((p) => published.filter((o) => covered.has(`${o.course_code}|${p}`)).length);

	// requirements tab: the student's own curriculum, or both for everyone else
	const own = profile.role === 'student' && profile.cohort != null ? curriculumFor(profile.cohort).id : null;
	const curricula: CurriculumId[] = own ? [own] : ['polsci-2564', 'polsci-2569'];
	const requirements = curricula.map((cid) => {
		const r = rows.filter((x) => x.curriculum_id === cid && (x.major === 'PA' || x.major === null));
		const entry = (code: string) => ({ code, name_th: catalog.get(code)?.name_th ?? code, status: statusIn(code), managed: catalog.get(code)?.managed_here ?? false });
		const codes = (cat: string, track?: string) => [...new Set(r.filter((x) => x.category === cat && (!track || x.track === track)).map((x) => x.course_code))].sort().map(entry);
		return {
			id: cid,
			facultyCore: codes('faculty_core'),
			majorRequired: codes('major_required'),
			requiredElective: codes('required_elective'),
			tracks: TRACKS.map((tr) => ({ ...tr, courses: codes('track_elective', tr.id) }))
		};
	});

	return {
		semesters: all.map((s) => ({ id: s.id, label: s.label })),
		semester,
		plos: PA_PLOS.map((code) => ({ code, text: ((plosRes.data ?? []) as { code: string; text_th: string }[]).find((p) => p.code === code)?.text_th ?? code })),
		matrix,
		footers,
		requirements,
		tab: url.searchParams.get('tab') === 'requirements' ? 'requirements' : 'map'
	};
};
