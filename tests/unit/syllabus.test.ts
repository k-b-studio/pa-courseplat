import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SyllabusDraft, SyllabusStrict, strictIssues, selfStudyHours, nextId, type SyllabusDoc } from '../../src/lib/schema/syllabus';

const example = (): SyllabusDoc => JSON.parse(readFileSync('data/examples/2404324-2569-2.json', 'utf-8'));

describe('syllabus schema (spec 02 AC 2)', () => {
	it('the example passes strict', () => {
		const r = SyllabusStrict.safeParse(example());
		if (!r.success) console.error(r.error.issues);
		expect(r.success).toBe(true);
	});

	it('removing all objectives fails strict at `objectives` with a Thai message', () => {
		const doc = example();
		doc.objectives = [];
		const issues = strictIssues(doc);
		const hit = issues.find((i) => i.path.join('.') === 'objectives');
		expect(hit).toBeDefined();
		expect(hit!.message).toMatch(/วัตถุประสงค์/);
		expect(SyllabusDraft.safeParse(doc).success).toBe(true);
	});

	it('weights summing to 95 fail at `evaluation.items`', () => {
		const doc = example();
		doc.evaluation.items[0].weightPercent = 5; // 10 → 5: total 95
		const issues = strictIssues(doc);
		const hit = issues.find((i) => i.path.join('.') === 'evaluation.items');
		expect(hit?.message).toBe('น้ำหนักคะแนนรวม 95% — ต้องครบ 100%');
		expect(SyllabusDraft.safeParse(doc).success).toBe(true);
	});

	it('a dangling readingIds entry fails strict but passes draft', () => {
		const doc = example();
		doc.weeklyPlan[0].readingIds = ['r-99'];
		const issues = strictIssues(doc);
		expect(issues.some((i) => i.path.join('.') === 'weeklyPlan.0.readingIds')).toBe(true);
		expect(SyllabusDraft.safeParse(doc).success).toBe(true);
	});

	it('S/U grading skips the 100% rule', () => {
		const doc = example();
		doc.evaluation.gradingScheme = 'su';
		doc.evaluation.items[0].weightPercent = 0;
		expect(strictIssues(doc).filter((i) => i.path.join('.') === 'evaluation.items')).toEqual([]);
	});

	it('duplicate and out-of-range weeks fail; cut-offs must decrease', () => {
		const doc = example();
		doc.weeklyPlan[1].week = 1;
		doc.weeklyPlan[2].week = 17;
		doc.evaluation.cutoffs[1].minPercent = 90;
		const paths = strictIssues(doc).map((i) => i.path.join('.'));
		expect(paths).toContain('weeklyPlan.1.week');
		expect(paths).toContain('weeklyPlan.2.week');
		expect(paths).toContain('evaluation.cutoffs');
	});

	it('draft accepts an empty document', () => {
		const r = SyllabusDraft.safeParse({
			schemaVersion: 1,
			overview: { focus: '', language: 'th', deliveryMode: 'onsite', workloadHoursPerWeek: null, keywords: [], prerequisiteNote: '' },
			objectives: [],
			approach: { methods: [], description: '', attendancePolicy: '', aiPolicy: 'unspecified', aiPolicyNote: '', lateWorkPolicy: '' },
			weeklyPlan: [],
			evaluation: { gradingScheme: 'letter', referencing: 'unspecified', items: [], cutoffs: [] },
			resources: { readings: [], materials: [], platforms: [] },
			work: [],
			keyDates: []
		});
		expect(r.success).toBe(true);
	});

	it('helpers', () => {
		expect(selfStudyHours('3 (3-0-6)')).toBe(6);
		expect(selfStudyHours('2 (2-0-4)')).toBe(4);
		expect(selfStudyHours(null)).toBeNull();
		expect(nextId(['clo-1', 'clo-3'], 'clo')).toBe('clo-4');
		expect(nextId([], 'w')).toBe('w-1');
	});
});
