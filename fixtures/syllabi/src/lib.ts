/**
 * Compact authoring for the FICTIONAL seed syllabi (spec 08 R3/R4). `npm run make:syllabi` expands
 * each spec into a SyllabusDoc and writes fixtures/syllabi/<semester>/<code>.json, which the seed
 * loads. Readings are real publications; when an edition or year was not certain, `year` is null.
 * Person references are demo keys ("@thanakrit"); the seed swaps in profile ids.
 */
import type { SyllabusDoc, PloCode, TeachingMethod } from '../../../src/lib/schema/syllabus';

type AiPolicy = SyllabusDoc['approach']['aiPolicy'];
type EvalType = SyllabusDoc['evaluation']['items'][number]['type'];
type WorkType = SyllabusDoc['work'][number]['type'];
type ReadingType = SyllabusDoc['resources']['readings'][number]['type'];

/** [topic, details, concepts, readings (r-n numbers), extras] */
export type WeekSpec =
	| [topic: string, details: string, concepts: string[], readings?: number[], extra?: { who?: string[]; activity?: string }]
	| { noClass: string };

export type ReadingSpec = {
	cite: string;
	title: string;
	authors: string;
	year: number | null;
	type: ReadingType;
	required: boolean;
	isbn?: string | null;
	doi?: string | null;
	url?: string | null;
};

export type WorkSpec = {
	title: string;
	type: WorkType;
	description: string;
	deliverable: string;
	groupSize?: string | null; // null/absent = individual
	due: number | null;
	evalNo?: number; // 1-based index into evals
	hours?: number | null;
};

export type Spec = {
	focus: string;
	keywords: string[];
	language?: SyllabusDoc['overview']['language'];
	delivery?: SyllabusDoc['overview']['deliveryMode'];
	hours?: number | null;
	prerequisiteNote?: string;
	clos: [text: string, plos: PloCode[]][];
	methods: TeachingMethod[];
	approach: string;
	ai: AiPolicy;
	aiNote?: string;
	attendance?: string;
	late?: string;
	/** default instructorIds for teaching weeks */
	lead: string[];
	weeks: WeekSpec[];
	/** [title, type, weight, individual, dueWeek, description] */
	evals: [string, EvalType, number, boolean, number | null, string?][];
	readings: ReadingSpec[];
	materials?: string[];
	platforms?: SyllabusDoc['resources']['platforms'];
	work?: WorkSpec[];
	keyDates?: [label: string, week: number | null][];
};

export const MIDTERM: WeekSpec = { noClass: 'สอบกลางภาค' };
export const ATTENDANCE = 'นิสิตต้องมีเวลาเรียนไม่น้อยกว่าร้อยละ 80 ของเวลาเรียนทั้งหมดจึงจะมีสิทธิ์สอบปลายภาค';
export const LATE = 'ส่งงานช้าหักร้อยละ 10 ของคะแนนงานนั้นต่อวัน ไม่รับงานที่ช้าเกิน 3 วัน เว้นแต่มีเหตุจำเป็นและแจ้งผู้สอนล่วงหน้า';
export const MCV = { name: 'MyCourseVille', url: null, note: 'ประกาศ เอกสาร และส่งงานทั้งหมด' };
export const CUTOFFS: SyllabusDoc['evaluation']['cutoffs'] = [
	{ grade: 'A', minPercent: 80 },
	{ grade: 'B+', minPercent: 75 },
	{ grade: 'B', minPercent: 70 },
	{ grade: 'C+', minPercent: 65 },
	{ grade: 'C', minPercent: 60 },
	{ grade: 'D+', minPercent: 55 },
	{ grade: 'D', minPercent: 50 },
	{ grade: 'F', minPercent: 0 }
];

export function build(s: Spec): SyllabusDoc {
	const evals = s.evals.map(([title, type, weightPercent, individual, dueWeek, description], i) => ({
		id: `e-${i + 1}`,
		title,
		type,
		weightPercent,
		individual,
		dueWeek,
		description: description ?? ''
	}));
	const keyDates =
		s.keyDates?.map(([label, week]) => ({ label, week, date: null })) ??
		[
			...evals.filter((e) => e.type === 'midterm_exam').map((e) => ({ label: 'สอบกลางภาค', week: e.dueWeek, date: null })),
			...(s.work ?? []).filter((w) => w.due).map((w) => ({ label: `ส่ง${w.title.split(':')[0]}`, week: w.due, date: null })),
			...evals.filter((e) => e.type === 'final_exam').map(() => ({ label: 'สอบปลายภาค', week: null, date: null }))
		];
	return {
		schemaVersion: 1,
		overview: {
			focus: s.focus,
			language: s.language ?? 'th',
			deliveryMode: s.delivery ?? 'onsite',
			workloadHoursPerWeek: s.hours === undefined ? 6 : s.hours,
			keywords: s.keywords,
			prerequisiteNote: s.prerequisiteNote ?? ''
		},
		objectives: s.clos.map(([text, ploCodes], i) => ({ id: `clo-${i + 1}`, text, ploCodes })),
		approach: {
			methods: s.methods,
			description: s.approach,
			attendancePolicy: s.attendance ?? ATTENDANCE,
			aiPolicy: s.ai,
			aiPolicyNote: s.aiNote ?? '',
			lateWorkPolicy: s.late ?? LATE
		},
		weeklyPlan: s.weeks.map((w, i) =>
			'noClass' in w
				? { week: i + 1, topic: w.noClass, details: '', concepts: [], instructorIds: [], readingIds: [], activity: '', noClass: true }
				: {
						week: i + 1,
						topic: w[0],
						details: w[1],
						concepts: w[2],
						instructorIds: w[4]?.who ?? s.lead,
						readingIds: (w[3] ?? []).map((n) => `r-${n}`),
						activity: w[4]?.activity ?? '',
						noClass: false
					}
		),
		evaluation: { gradingScheme: 'letter', referencing: 'criterion', items: evals, cutoffs: CUTOFFS },
		resources: {
			readings: s.readings.map((r, i) => ({
				id: `r-${i + 1}`,
				citation: r.cite,
				title: r.title,
				authors: r.authors,
				year: r.year,
				type: r.type,
				required: r.required,
				url: r.url ?? null,
				isbn: r.isbn ?? null,
				doi: r.doi ?? null
			})),
			materials: s.materials ?? ['สไลด์ประกอบการบรรยายรายสัปดาห์'],
			platforms: s.platforms ?? [MCV]
		},
		work: (s.work ?? []).map((w, i) => ({
			id: `w-${i + 1}`,
			title: w.title,
			type: w.type,
			description: w.description,
			deliverable: w.deliverable,
			individual: !w.groupSize,
			groupSize: w.groupSize ?? null,
			dueWeek: w.due,
			evaluationItemId: w.evalNo ? `e-${w.evalNo}` : null,
			estimatedHours: w.hours ?? null
		})),
		keyDates
	};
}

// readings used by more than one course: one definition, so citations match exactly ----------
export const R = {
	shafritzHyde: {
		cite: 'Shafritz, J. M., & Hyde, A. C. (Eds.). Classics of public administration. Cengage Learning.',
		title: 'Classics of Public Administration',
		authors: 'Jay M. Shafritz, Albert C. Hyde (eds.)',
		year: null,
		type: 'book',
		required: false
	},
	dye: {
		cite: 'Dye, T. R. (2017). Understanding public policy (15th ed.). Pearson.',
		title: 'Understanding Public Policy',
		authors: 'Thomas R. Dye',
		year: 2017,
		type: 'book',
		required: true,
		isbn: '9780134169972'
	}
} satisfies Record<string, ReadingSpec>;
