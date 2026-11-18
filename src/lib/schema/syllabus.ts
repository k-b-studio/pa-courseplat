/**
 * The syllabus document: the single source of truth (spec 02 R1).
 * Editor validation, server validation, the AI output schema and the seed fixtures all use it.
 *
 * Draft (saving) checks structure and types only; everything may be empty.
 * Strict (publishing) adds minimums and cross-checks, each with a Thai message and a path.
 */
import { z } from 'zod';

export const PLO_CODES = ['PLO1', 'PLO2', 'PLO3', 'PLO4', 'PLO5', 'PLO1D', 'PLO2D', 'PLO3D', 'PLO4D', 'PLO5D'] as const;
export const TEACHING_METHODS = [
	'lecture',
	'discussion',
	'case_study',
	'modular',
	'workshop_seminar',
	'role_play',
	'problem_based',
	'game_based',
	'field_visit',
	'independent_study',
	'brainstorming',
	'guest_speaker',
	'internship',
	'flipped',
	'group_project',
	'policy_lab'
] as const;
export const EVAL_TYPES = [
	'midterm_exam',
	'final_exam',
	'quiz',
	'paper',
	'policy_brief',
	'case_analysis',
	'presentation',
	'project',
	'participation',
	'attendance',
	'reflection',
	'other'
] as const;
export const WORK_TYPES = [
	'paper',
	'policy_brief',
	'case_analysis',
	'presentation',
	'project',
	'fieldwork_report',
	'exercise',
	'reading_response',
	'other'
] as const;
export const READING_TYPES = ['book', 'chapter', 'article', 'report', 'law', 'web', 'video', 'other'] as const;
export const LANGUAGES = ['th', 'en', 'th_en'] as const;
export const DELIVERY_MODES = ['onsite', 'online', 'hybrid'] as const;
export const AI_POLICIES = ['not_allowed', 'allowed_with_disclosure', 'allowed', 'unspecified'] as const;
export const GRADING_SCHEMES = ['letter', 'su'] as const;
export const REFERENCING = ['criterion', 'norm', 'mixed', 'unspecified'] as const;
export const GRADES = ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'] as const;

export type PloCode = (typeof PLO_CODES)[number];
export type TeachingMethod = (typeof TEACHING_METHODS)[number];
export type EvalType = (typeof EVAL_TYPES)[number];
export type WorkType = (typeof WORK_TYPES)[number];
export type ReadingType = (typeof READING_TYPES)[number];

export const DEFAULT_WEEKS = 16;

export const M = {
	focusMin: 'จุดเน้นภาคการศึกษานี้ต้องมีอย่างน้อย 40 ตัวอักษร',
	keywordsMax: 'คำสำคัญได้ไม่เกิน 10 คำ',
	objectivesMin: 'ต้องมีวัตถุประสงค์การเรียนรู้ (CLO) อย่างน้อย 1 ข้อ',
	objectiveText: 'กรอกข้อความวัตถุประสงค์',
	objectivePlo: 'วัตถุประสงค์แต่ละข้อต้องเชื่อมกับ PLO อย่างน้อย 1 รายการ',
	methodsMin: 'เลือกวิธีการสอนอย่างน้อย 1 วิธี',
	weeklyMin: 'แผนการสอนรายสัปดาห์ต้องมีอย่างน้อย 10 สัปดาห์',
	weekTopic: 'กรอกหัวข้อของสัปดาห์นี้',
	weekDup: (w: number) => `สัปดาห์ที่ ${w} ซ้ำกัน`,
	weekRange: (n: number) => `เลขสัปดาห์ต้องอยู่ระหว่าง 1–${n}`,
	conceptsMax: 'แท็กแนวคิดได้ไม่เกิน 8 คำต่อสัปดาห์',
	readingMissing: (id: string) => `อ้างถึงเอกสาร ${id} ที่ไม่มีในรายการเอกสาร`,
	evalTitle: 'กรอกชื่อรายการประเมิน',
	evalMin: 'ต้องมีรายการประเมินผลอย่างน้อย 1 รายการ',
	weightsSum: (n: number) => `น้ำหนักคะแนนรวม ${fmtNum(n)}% — ต้องครบ 100%`,
	dueRange: (n: number) => `สัปดาห์กำหนดส่งต้องอยู่ระหว่าง 1–${n}`,
	cutoffsOrder: 'เกณฑ์ตัดเกรดต้องเรียงจากมากไปน้อยโดยไม่ซ้ำกัน',
	readingCitation: 'กรอกรายการอ้างอิงของเอกสาร',
	workTitle: 'กรอกชื่องาน',
	evalItemMissing: (id: string) => `อ้างถึงรายการประเมิน ${id} ที่ไม่มีอยู่`,
	idDup: (id: string) => `รหัส ${id} ซ้ำกัน`
};

function fmtNum(n: number) {
	return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export type SyllabusSchemaOptions = { strict: boolean; weeks?: number };

/** One factory for both variants (spec 02). */
export function makeSyllabusSchema({ strict, weeks = DEFAULT_WEEKS }: SyllabusSchemaOptions) {
	const str = () => z.string();
	const nonEmpty = (msg: string) => (strict ? z.string().trim().min(1, msg) : z.string());
	const int = () => z.number().int();

	const overview = z.object({
		focus: strict ? z.string().trim().min(40, M.focusMin) : z.string(),
		language: z.enum(LANGUAGES),
		deliveryMode: z.enum(DELIVERY_MODES),
		workloadHoursPerWeek: z.number().min(0).max(60).nullable(),
		keywords: strict ? z.array(z.string()).max(10, M.keywordsMax) : z.array(z.string()),
		prerequisiteNote: str()
	});

	const objective = z.object({
		id: str(),
		text: nonEmpty(M.objectiveText),
		ploCodes: strict ? z.array(z.enum(PLO_CODES)).min(1, M.objectivePlo) : z.array(z.enum(PLO_CODES))
	});

	const approach = z.object({
		methods: strict ? z.array(z.enum(TEACHING_METHODS)).min(1, M.methodsMin) : z.array(z.enum(TEACHING_METHODS)),
		description: str(),
		attendancePolicy: str(),
		aiPolicy: z.enum(AI_POLICIES),
		aiPolicyNote: str(),
		lateWorkPolicy: str()
	});

	const week = z.object({
		week: int(),
		topic: str(),
		details: str(),
		concepts: strict ? z.array(z.string()).max(8, M.conceptsMax) : z.array(z.string()),
		instructorIds: z.array(z.string()),
		readingIds: z.array(z.string()),
		activity: str(),
		noClass: z.boolean()
	});

	const evalItem = z.object({
		id: str(),
		title: nonEmpty(M.evalTitle),
		type: z.enum(EVAL_TYPES),
		weightPercent: z.number().min(0).max(100),
		individual: z.boolean(),
		dueWeek: int().nullable(),
		description: str()
	});

	const evaluation = z.object({
		gradingScheme: z.enum(GRADING_SCHEMES),
		referencing: z.enum(REFERENCING),
		items: strict ? z.array(evalItem).min(1, M.evalMin) : z.array(evalItem),
		cutoffs: z.array(z.object({ grade: z.enum(GRADES), minPercent: z.number().min(0).max(100) }))
	});

	const reading = z.object({
		id: str(),
		citation: nonEmpty(M.readingCitation),
		title: str(),
		authors: str(),
		year: int().nullable(),
		type: z.enum(READING_TYPES),
		required: z.boolean(),
		url: z.string().nullable(),
		isbn: z.string().nullable(),
		doi: z.string().nullable()
	});

	const resources = z.object({
		readings: z.array(reading),
		materials: z.array(z.string()),
		platforms: z.array(z.object({ name: str(), url: z.string().nullable(), note: str() }))
	});

	const workItem = z.object({
		id: str(),
		title: nonEmpty(M.workTitle),
		type: z.enum(WORK_TYPES),
		description: str(),
		deliverable: str(),
		individual: z.boolean(),
		groupSize: z.string().nullable(),
		dueWeek: int().nullable(),
		evaluationItemId: z.string().nullable(),
		estimatedHours: z.number().min(0).nullable()
	});

	const keyDate = z.object({ label: str(), week: int().nullable(), date: z.string().nullable() });

	const base = z.object({
		schemaVersion: z.literal(1),
		overview,
		objectives: strict ? z.array(objective).min(1, M.objectivesMin) : z.array(objective),
		approach,
		weeklyPlan: strict ? z.array(week).min(10, M.weeklyMin) : z.array(week),
		evaluation,
		resources,
		work: z.array(workItem),
		keyDates: z.array(keyDate)
	});

	if (!strict) return base;

	return base.superRefine((doc, ctx) => {
		// 1. letter grading: weights sum to exactly 100
		if (doc.evaluation.gradingScheme === 'letter' && doc.evaluation.items.length > 0) {
			const sum = doc.evaluation.items.reduce((s, i) => s + i.weightPercent, 0);
			if (Math.abs(sum - 100) > 0.001) {
				ctx.addIssue({ code: 'custom', path: ['evaluation', 'items'], message: M.weightsSum(sum) });
			}
		}
		// 2. week numbers unique and within the semester; topics present on teaching weeks
		const seen = new Set<number>();
		doc.weeklyPlan.forEach((w, i) => {
			if (w.week < 1 || w.week > weeks) {
				ctx.addIssue({ code: 'custom', path: ['weeklyPlan', i, 'week'], message: M.weekRange(weeks) });
			}
			if (seen.has(w.week)) {
				ctx.addIssue({ code: 'custom', path: ['weeklyPlan', i, 'week'], message: M.weekDup(w.week) });
			}
			seen.add(w.week);
			if (!w.topic.trim()) {
				ctx.addIssue({ code: 'custom', path: ['weeklyPlan', i, 'topic'], message: M.weekTopic });
			}
		});
		// 3. references resolve (instructorIds are checked on the server, which knows the sections)
		const readingIds = new Set(doc.resources.readings.map((r) => r.id));
		doc.weeklyPlan.forEach((w, i) => {
			for (const rid of w.readingIds) {
				if (!readingIds.has(rid)) {
					ctx.addIssue({ code: 'custom', path: ['weeklyPlan', i, 'readingIds'], message: M.readingMissing(rid) });
				}
			}
		});
		const evalIds = new Set(doc.evaluation.items.map((e) => e.id));
		doc.work.forEach((w, i) => {
			if (w.evaluationItemId && !evalIds.has(w.evaluationItemId)) {
				ctx.addIssue({
					code: 'custom',
					path: ['work', i, 'evaluationItemId'],
					message: M.evalItemMissing(w.evaluationItemId)
				});
			}
		});
		// 4. due weeks within the semester
		doc.evaluation.items.forEach((e, i) => {
			if (e.dueWeek !== null && (e.dueWeek < 1 || e.dueWeek > weeks)) {
				ctx.addIssue({ code: 'custom', path: ['evaluation', 'items', i, 'dueWeek'], message: M.dueRange(weeks) });
			}
		});
		doc.work.forEach((w, i) => {
			if (w.dueWeek !== null && (w.dueWeek < 1 || w.dueWeek > weeks)) {
				ctx.addIssue({ code: 'custom', path: ['work', i, 'dueWeek'], message: M.dueRange(weeks) });
			}
		});
		// 5. cut-offs strictly decreasing
		const cut = doc.evaluation.cutoffs;
		for (let i = 1; i < cut.length; i++) {
			if (!(cut[i].minPercent < cut[i - 1].minPercent)) {
				ctx.addIssue({ code: 'custom', path: ['evaluation', 'cutoffs'], message: M.cutoffsOrder });
				break;
			}
		}
		// ids stay unique inside a document (cautions and diffs refer to them)
		const dupCheck = (list: { id: string }[], path: (string | number)[]) => {
			const ids = new Set<string>();
			list.forEach((x, i) => {
				if (ids.has(x.id)) ctx.addIssue({ code: 'custom', path: [...path, i, 'id'], message: M.idDup(x.id) });
				ids.add(x.id);
			});
		};
		dupCheck(doc.objectives, ['objectives']);
		dupCheck(doc.evaluation.items, ['evaluation', 'items']);
		dupCheck(doc.resources.readings, ['resources', 'readings']);
		dupCheck(doc.work, ['work']);
	});
}

export const SyllabusDraft = makeSyllabusSchema({ strict: false });
export const SyllabusStrict = makeSyllabusSchema({ strict: true });

export type SyllabusDoc = z.infer<typeof SyllabusDraft>;
export type WeekRow = SyllabusDoc['weeklyPlan'][number];
export type EvalItem = SyllabusDoc['evaluation']['items'][number];
export type Reading = SyllabusDoc['resources']['readings'][number];
export type WorkItem = SyllabusDoc['work'][number];
export type Objective = SyllabusDoc['objectives'][number];
export type KeyDate = SyllabusDoc['keyDates'][number];

export type ValidationIssue = { path: (string | number)[]; message: string };

/** Run the strict schema; return Thai issues with paths (empty = ready to publish). */
export function strictIssues(doc: unknown, weeks = DEFAULT_WEEKS): ValidationIssue[] {
	const schema = weeks === DEFAULT_WEEKS ? SyllabusStrict : makeSyllabusSchema({ strict: true, weeks });
	const r = schema.safeParse(doc);
	if (r.success) return [];
	return r.error.issues.map((i) => ({ path: i.path.map((p) => (typeof p === 'symbol' ? String(p) : p)), message: i.message }));
}

/** Self-study hours from a credit format: '3 (3-0-6)' → 6. */
export function selfStudyHours(creditFormat: string | null | undefined): number | null {
	const m = creditFormat?.match(/\((\d+)-(\d+)-(\d+)\)/);
	return m ? Number(m[3]) : null;
}

export function emptySyllabus(creditFormat?: string | null): SyllabusDoc {
	return {
		schemaVersion: 1,
		overview: {
			focus: '',
			language: 'th',
			deliveryMode: 'onsite',
			workloadHoursPerWeek: selfStudyHours(creditFormat),
			keywords: [],
			prerequisiteNote: ''
		},
		objectives: [],
		approach: {
			methods: [],
			description: '',
			attendancePolicy: '',
			aiPolicy: 'unspecified',
			aiPolicyNote: '',
			lateWorkPolicy: ''
		},
		weeklyPlan: [],
		evaluation: { gradingScheme: 'letter', referencing: 'unspecified', items: [], cutoffs: [] },
		resources: { readings: [], materials: [], platforms: [] },
		work: [],
		keyDates: []
	};
}

export function emptyWeek(week: number): WeekRow {
	return { week, topic: '', details: '', concepts: [], instructorIds: [], readingIds: [], activity: '', noClass: false };
}

/** Next free id with a prefix: nextId(['clo-1','clo-3'], 'clo') → 'clo-4'. */
export function nextId(existing: string[], prefix: string): string {
	let max = 0;
	for (const id of existing) {
		const m = id.match(new RegExp(`^${prefix}-(\\d+)$`));
		if (m) max = Math.max(max, Number(m[1]));
	}
	return `${prefix}-${max + 1}`;
}
