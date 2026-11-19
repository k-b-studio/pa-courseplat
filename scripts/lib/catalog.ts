/**
 * Real catalog rows from data/*.json (spec 08 R3; provenance in data/README.md). Pure: no I/O,
 * so the mapping is unit-tested. Curriculum entries are kept only for courses in the catalog
 * (faculty-core courses taught by other departments are not in data/courses.json).
 */
import coursesJson from '../../data/courses.json';
import curriculaJson from '../../data/curriculum-pa.json';
import plosJson from '../../data/plos-2569.json';

export type CourseRow = {
	code: string;
	name_th: string;
	name_en: string;
	short_name_en: string | null;
	credits: number;
	credit_format: string;
	level: number;
	department: string;
	prerequisite_text: string | null;
	prerequisite_codes: string[];
	description_th: string | null;
	description_en: string | null;
	managed_here: boolean;
};
export type CurriculumRow = { id: string; name_th: string; name_en: string | null; cohort_min: number; cohort_max: number | null };
export type PloRow = { code: string; curriculum_id: string; major: 'PA' | null; text_th: string; teaching_methods: string[]; assessment_methods: string[] };
export type CurriculumCourseRow = {
	curriculum_id: string;
	course_code: string;
	major: 'PA' | null;
	category: 'faculty_core' | 'major_required' | 'track_elective' | 'required_elective';
	track: string | null;
	track_name_th: string | null;
};
export type CoursePloRow = { course_code: string; plo_code: string };

type RawCourse = Record<string, any>;

export function courseRows(): CourseRow[] {
	const own = (coursesJson.courses as RawCourse[]).map((c) => ({
		code: c.code,
		name_th: c.nameTH,
		name_en: c.nameEN,
		short_name_en: c.shortNameEN ?? null,
		credits: c.credits,
		credit_format: c.creditFormat,
		level: c.level,
		department: c.department,
		prerequisite_text: c.prerequisiteText ?? null,
		prerequisite_codes: c.prerequisiteCodes ?? [],
		description_th: c.descriptionTH ?? null,
		description_en: c.descriptionEN ?? null,
		managed_here: true
	}));
	// external courses (accounting) appear only in PA track rules; no syllabus management
	const external = (coursesJson.externalCourses as RawCourse[]).map((c) => ({
		code: c.code,
		name_th: c.nameTH,
		name_en: c.nameEN,
		short_name_en: null,
		credits: c.credits,
		credit_format: c.creditFormat ?? String(c.credits),
		level: c.level ?? Number(String(c.code)[4]),
		department: c.department ?? 'EXTERNAL',
		prerequisite_text: null,
		prerequisite_codes: [],
		description_th: null,
		description_en: null,
		managed_here: false
	}));
	return [...own, ...external];
}

export function curriculumRows(): CurriculumRow[] {
	return (curriculaJson.curricula as RawCourse[]).map((c) => ({
		id: c.id,
		name_th: c.nameTH,
		name_en: c.nameEN ?? null,
		cohort_min: Math.min(...c.cohorts),
		cohort_max: c.cohortsOpenEnded ? null : Math.max(...c.cohorts)
	}));
}

export function ploRows(): PloRow[] {
	return (plosJson.plos as RawCourse[]).map((p) => ({
		code: p.code,
		curriculum_id: plosJson.curriculumId,
		major: p.major ?? null,
		text_th: p.textTH,
		teaching_methods: p.teachingMethods ?? [],
		assessment_methods: p.assessmentMethods ?? []
	}));
}

export function curriculumCourseRows(known = new Set(courseRows().map((c) => c.code))): CurriculumCourseRow[] {
	const rows: CurriculumCourseRow[] = [];
	const add = (r: CurriculumCourseRow) => {
		if (!known.has(r.course_code)) return;
		const key = JSON.stringify(r);
		if (!rows.some((x) => JSON.stringify(x) === key)) rows.push(r);
	};
	for (const c of curriculaJson.curricula as RawCourse[]) {
		const base = { curriculum_id: c.id as string, track: null, track_name_th: null };
		for (const code of c.facultyCore?.codes ?? []) add({ ...base, course_code: code, major: null, category: 'faculty_core' });
		for (const code of c.paMajorRequired?.codes ?? []) add({ ...base, course_code: code, major: 'PA', category: 'major_required' });
		const groups = [...(c.paElectives?.noMinor?.children ?? []), ...(c.paElectives?.withMinor?.children ?? [])];
		for (const g of groups) {
			for (const track of g.chooseOneGroup ?? [])
				for (const code of track.ids ?? [])
					add({ curriculum_id: c.id, course_code: code, major: 'PA', category: 'track_elective', track: track.id, track_name_th: track.nameTH });
			for (const k of g.constraints ?? [])
				if (k.type === 'must-include') for (const code of k.ids ?? []) add({ ...base, course_code: code, major: 'PA', category: 'required_elective' });
			if (g.match?.type === 'courses') for (const code of g.match.ids ?? []) add({ ...base, course_code: code, major: 'PA', category: 'required_elective' });
		}
	}
	return rows;
}

/** The curriculum's own example courses per PLO (not an exhaustive map; data/README.md). */
export function coursePloRows(known = new Set(courseRows().map((c) => c.code))): CoursePloRow[] {
	const out: CoursePloRow[] = [];
	for (const [plo, codes] of Object.entries(plosJson.officialCourseExamples)) {
		if (plo.startsWith('_') || !Array.isArray(codes)) continue;
		for (const code of codes) if (known.has(code)) out.push({ course_code: code, plo_code: plo });
	}
	return out;
}
