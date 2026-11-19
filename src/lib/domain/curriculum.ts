/**
 * Cohort → curriculum and course badges (spec 03 AC 1, spec 04 badge logic). Pure; unit-tested.
 * 2564 covers cohorts 66–68; 2569 covers cohort 69 onwards. Older cohorts fall back to 2564
 * with a notice, because this demo has no earlier curriculum.
 */
export type CurriculumId = 'polsci-2564' | 'polsci-2569';
export const CURRICULA: CurriculumId[] = ['polsci-2564', 'polsci-2569'];
export const curriculumYear = (id: string) => id.replace('polsci-', '');

/** First two digits of a PolSci student ID (`6712345624@…` → 67); null for any other address. */
export function cohortFromEmail(email: string): number | null {
	const m = /^([0-9]{2})[0-9]{6}24@student\.chula\.ac\.th$/.exec(email.trim().toLowerCase());
	return m ? Number(m[1]) : null;
}

export function curriculumForCohort(cohort: number): CurriculumId {
	return cohort >= 69 ? 'polsci-2569' : 'polsci-2564';
}

/** The same, plus whether to show "this cohort predates the curricula in the system". */
export function curriculumFor(cohort: number): { id: CurriculumId; notice: boolean } {
	return { id: curriculumForCohort(cohort), notice: cohort < 66 };
}

export type CurriculumRow = {
	curriculum_id: string;
	course_code: string;
	major: string | null;
	category: 'faculty_core' | 'major_required' | 'track_elective' | 'required_elective';
	track: string | null;
	track_name_th: string | null;
};

export type StatusKind = 'faculty_core' | 'major_required' | 'track_elective' | 'required_elective' | 'elective' | 'elective_other_major';
export type CourseStatus = { kind: StatusKind; tracks: { id: string; name: string }[] };

/**
 * spec 04: faculty core → major required → required elective → track elective → elective.
 * A non-PA student sees PA courses as "วิชาเลือก (นอกสาขา)" unless they are faculty core.
 */
export function courseStatusFor(code: string, curriculumId: string, major: string | null, rows: CurriculumRow[], department = 'PA'): CourseStatus {
	const mine = rows.filter((r) => r.curriculum_id === curriculumId && r.course_code === code);
	if (mine.some((r) => r.category === 'faculty_core')) return { kind: 'faculty_core', tracks: [] };
	if (major !== 'PA' && department === 'PA') return { kind: 'elective_other_major', tracks: [] };
	const forMajor = mine.filter((r) => r.major === major);
	if (forMajor.some((r) => r.category === 'major_required')) return { kind: 'major_required', tracks: [] };
	if (forMajor.some((r) => r.category === 'required_elective')) return { kind: 'required_elective', tracks: [] };
	const tracks = forMajor
		.filter((r) => r.category === 'track_elective' && r.track)
		.map((r) => ({ id: r.track!, name: r.track_name_th ?? r.track! }))
		.sort((a, b) => TRACK_ORDER.indexOf(a.id) - TRACK_ORDER.indexOf(b.id));
	if (tracks.length) return { kind: 'track_elective', tracks };
	return { kind: 'elective', tracks: [] };
}

export const TRACK_ORDER = ['pa-fiscal', 'pa-personnel', 'pa-policy'];
export const TRACKS: { id: string; name: string }[] = [
	{ id: 'pa-fiscal', name: 'สายบริหารงานคลัง' },
	{ id: 'pa-personnel', name: 'สายบริหารงานบุคคล' },
	{ id: 'pa-policy', name: 'สายนโยบายและการวางแผน' }
];

export function statusLabel(s: CourseStatus): string {
	switch (s.kind) {
		case 'faculty_core':
			return 'บังคับคณะ';
		case 'major_required':
			return 'บังคับสาขา (PA)';
		case 'required_elective':
			return 'วิชาเลือกที่ต้องเรียน (สัมมนา)';
		case 'track_elective':
			return `วิชาเลือกกลุ่ม: ${s.tracks.map((t) => t.name).join(' · ')}`;
		case 'elective_other_major':
			return 'วิชาเลือก (นอกสาขา)';
		default:
			return 'วิชาเลือก';
	}
}

/** Staff and instructors: the PA status in both curricula, grouped ("บังคับสาขา PA · 2564, 2569"). */
export function staffBadges(code: string, rows: CurriculumRow[], department = 'PA'): string[] {
	const byLabel = new Map<string, string[]>();
	for (const c of CURRICULA) {
		const s = courseStatusFor(code, c, 'PA', rows, department);
		const label = statusLabel(s).replace('บังคับสาขา (PA)', 'บังคับสาขา PA');
		byLabel.set(label, [...(byLabel.get(label) ?? []), curriculumYear(c)]);
	}
	return [...byLabel].map(([label, years]) => `${label} · ${years.join(', ')}`);
}

/** Filter groups on /courses (spec 04 R1 "my status"). */
export const STATUS_FILTERS: { id: string; label: string; kinds: StatusKind[] }[] = [
	{ id: 'faculty_core', label: 'บังคับคณะ', kinds: ['faculty_core'] },
	{ id: 'major_required', label: 'บังคับสาขา', kinds: ['major_required'] },
	{ id: 'track_elective', label: 'วิชาเลือกกลุ่ม', kinds: ['track_elective', 'required_elective'] },
	{ id: 'elective', label: 'วิชาเลือก', kinds: ['elective', 'elective_other_major'] }
];

/** Year level from the 5th digit of the code (spec 04 R1). */
export const courseLevel = (code: string) => Number(code[4]);
