import { describe, expect, it } from 'vitest';
import { coursePloRows, courseRows, curriculumCourseRows, curriculumRows, ploRows } from '../../scripts/lib/catalog';
import people from '../../fixtures/people.json';
import offerings from '../../fixtures/offerings.json';

describe('catalog rows from data/', () => {
	it('has the 34 courses plus two external accounting courses', () => {
		const rows = courseRows();
		expect(rows).toHaveLength(36);
		expect(rows.filter((r) => !r.managed_here).map((r) => r.code).sort()).toEqual(['2601112', '2601115']);
		expect(rows.every((r) => /^\d{7}$/.test(r.code) && r.credit_format && r.level >= 1)).toBe(true);
	});

	it('maps cohorts to curricula', () => {
		expect(curriculumRows()).toEqual([
			expect.objectContaining({ id: 'polsci-2564', cohort_min: 66, cohort_max: 68 }),
			expect.objectContaining({ id: 'polsci-2569', cohort_min: 69, cohort_max: null })
		]);
	});

	it('has PLO1–5 and PLO1D–5D', () => {
		expect(ploRows().map((p) => p.code)).toEqual(['PLO1', 'PLO2', 'PLO3', 'PLO4', 'PLO5', 'PLO1D', 'PLO2D', 'PLO3D', 'PLO4D', 'PLO5D']);
	});

	it('builds curriculum categories for courses in the catalog only', () => {
		const rows = curriculumCourseRows();
		const find = (cur: string, code: string) => rows.filter((r) => r.curriculum_id === cur && r.course_code === code).map((r) => `${r.category}:${r.track ?? ''}`);
		expect(find('polsci-2569', '2400114')).toEqual(['faculty_core:']);
		expect(find('polsci-2569', '2404324')).toEqual(['major_required:']);
		expect(find('polsci-2569', '2404480')).toEqual(['required_elective:']);
		expect(find('polsci-2569', '2404422').sort()).toEqual(['track_elective:pa-fiscal', 'track_elective:pa-policy']);
		const known = new Set(courseRows().map((c) => c.code));
		expect(rows.every((r) => known.has(r.course_code))).toBe(true);
		expect(new Set(rows.map((r) => JSON.stringify(r))).size).toBe(rows.length);
	});

	it('keeps the official PLO example courses', () => {
		const rows = coursePloRows();
		expect(rows).toContainEqual({ course_code: '2404324', plo_code: 'PLO1D' });
		expect(rows).toContainEqual({ course_code: '2400114', plo_code: 'PLO1' });
	});
});

describe('fictional people and offerings fixtures (spec 08)', () => {
	it('uses .test addresses only', () => {
		expect(people.people.every((p) => p.email.endsWith('@courseplat.test'))).toBe(true);
		expect(people.people).toHaveLength(10);
	});

	it('has the 14 offerings of 2/2569 for catalog courses, and no instructor teaching two places at once', () => {
		const list = offerings.offerings['2569-2'];
		expect(list).toHaveLength(14);
		const known = new Set(courseRows().map((c) => c.code));
		expect(list.every((o) => known.has(o.course))).toBe(true);
		const slots = new Map<string, string>();
		for (const o of list)
			for (const s of o.sections)
				for (const m of s.meetings)
					for (const who of s.instructors) {
						const key = `${who}|${m.weekday}|${m.start}`;
						expect(slots.get(key), `${who} double-booked`).toBeUndefined();
						slots.set(key, o.course);
					}
	});
});
