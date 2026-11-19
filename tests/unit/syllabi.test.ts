import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SyllabusDraft, strictIssues } from '$lib/schema/syllabus';
import { syllabusSources } from '../../fixtures/syllabi/src/index';
import offerings from '../../fixtures/offerings.json';
import index from '../../fixtures/syllabi/index.json';

const all = Object.entries(syllabusSources).flatMap(([semester, m]) =>
	Object.entries(m.syllabi).map(([code, doc]) => ({ semester, code, doc, status: (m.STATUS as Record<string, string>)[code] }))
);

describe('seed syllabi (spec 08 AC 2)', () => {
	it('has 18 syllabi: 2 archived, 5 active, 11 in 2/2569', () => {
		expect(all.length).toBe(18);
		expect(Object.keys(index['2569-2']).length).toBe(11);
	});

	it.each(all.filter((x) => x.status === 'published').map((x) => [`${x.semester} ${x.code}`, x]))('%s passes strict', (_, x) => {
		expect(strictIssues(x.doc)).toEqual([]);
	});

	it('2404318 (draft) passes draft and fails strict only on the evaluation total', () => {
		const d = syllabusSources['2569-2'].syllabi['2404318'];
		expect(SyllabusDraft.safeParse(d).success).toBe(true);
		const issues = strictIssues(d);
		expect(issues).toHaveLength(1);
		expect(issues[0].path).toEqual(['evaluation', 'items']);
		expect(issues[0].message).toContain('90');
		expect(d.weeklyPlan.map((w) => w.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
	});

	it('2404324 in 2/2569 is the example file unchanged', () => {
		expect(syllabusSources['2569-2'].syllabi['2404324']).toEqual(JSON.parse(readFileSync('data/examples/2404324-2569-2.json', 'utf-8')));
	});

	it('the JSON fixtures are up to date (npm run make:syllabi)', () => {
		for (const x of all) expect(JSON.parse(readFileSync(`fixtures/syllabi/${x.semester}/${x.code}.json`, 'utf-8')), `${x.semester} ${x.code}`).toEqual(x.doc);
	});

	it('every instructor named in a weekly plan teaches a section of that offering', () => {
		const sections = offerings.offerings as Record<string, { course: string; sections: { instructors: string[] }[] }[]>;
		for (const x of all) {
			const o = sections[x.semester].find((y) => y.course === x.code);
			expect(o, `${x.semester} ${x.code} has an offering`).toBeTruthy();
			const teaching = new Set(o!.sections.flatMap((s) => s.instructors));
			for (const w of x.doc.weeklyPlan) for (const k of w.instructorIds) expect(teaching.has(k), `${x.code} wk ${w.week} ${k}`).toBe(true);
		}
	});

	it('year-3 assessed weight in week 12 of 2/2569 adds up to 65% (spec 08)', () => {
		const s = syllabusSources['2569-2'];
		const level3 = Object.entries(s.syllabi).filter(([code]) => code[4] === '3' && s.STATUS[code] === 'published');
		const wk12 = level3.flatMap(([, d]) => d.evaluation.items.filter((e) => e.dueWeek === 12)).reduce((a, e) => a + e.weightPercent, 0);
		expect(wk12).toBe(65);
	});
});
