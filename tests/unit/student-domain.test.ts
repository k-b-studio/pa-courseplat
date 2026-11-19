import { describe, expect, it } from 'vitest';
import { clashes, normTitle, sharedConcepts, sharedReadings } from '$lib/domain/compare';
import { courseStatusFor, staffBadges, statusLabel, type CurriculumRow } from '$lib/domain/curriculum';
import { weekRange, weekStart } from '$lib/domain/weeks';
import { basketLoad, hoursPerWeek, weeklyLoad } from '$lib/domain/workload';
import { curriculumCourseRows } from '../../scripts/lib/catalog';
import { syllabusSources } from '../../fixtures/syllabi/src/index';

const rows = curriculumCourseRows() as CurriculumRow[];
const s = syllabusSources['2569-2'].syllabi;

describe('badges (spec 04 AC 1)', () => {
	it('cohort 67 PA student: 2404324 is major required, 2404429 is in two tracks', () => {
		expect(statusLabel(courseStatusFor('2404324', 'polsci-2564', 'PA', rows))).toBe('บังคับสาขา (PA)');
		expect(statusLabel(courseStatusFor('2404429', 'polsci-2564', 'PA', rows))).toBe('วิชาเลือกกลุ่ม: สายบริหารงานคลัง · สายนโยบายและการวางแผน');
		expect(statusLabel(courseStatusFor('2404480', 'polsci-2564', 'PA', rows))).toBe('วิชาเลือกที่ต้องเรียน (สัมมนา)');
		expect(statusLabel(courseStatusFor('2400114', 'polsci-2564', 'PA', rows, 'FACULTY'))).toBe('บังคับคณะ');
	});
	it('non-PA students see PA courses as out-of-major electives, but faculty core stays', () => {
		expect(statusLabel(courseStatusFor('2404324', 'polsci-2569', 'IR', rows))).toBe('วิชาเลือก (นอกสาขา)');
		expect(statusLabel(courseStatusFor('2400114', 'polsci-2569', 'IR', rows, 'FACULTY'))).toBe('บังคับคณะ');
	});
	it('staff see both curricula', () => {
		expect(staffBadges('2404324', rows)).toEqual(['บังคับสาขา PA · 2564, 2569']);
	});
});

describe('workload (spec 04)', () => {
	it('places dated items, keeps finals and undated items apart', () => {
		const w = weeklyLoad(s['2404324']);
		expect(w.load[7]).toBe(25); // midterm week 8
		expect(w.load[11]).toBe(20); // policy brief week 12
		expect(w.load[14]).toBe(15);
		expect(w.finals.map((f) => f.weight)).toEqual([30]);
		expect(w.undated.map((f) => f.weight)).toEqual([10]);
		expect(w.load.reduce((a, b) => a + b, 0) + 30 + 10).toBe(100);
	});
	it('adds up a basket', () => {
		const b = basketLoad([
			{ doc: s['2404317'], course: '2404317' },
			{ doc: s['2404324'], course: '2404324' },
			{ doc: s['2404312'], course: '2404312' }
		]);
		expect(b.total[11]).toBe(65);
	});
	it('hours per week falls back to the self-study hours of the credit format', () => {
		expect(hoursPerWeek({ overview: { ...s['2404324'].overview, workloadHoursPerWeek: null } }, '3 (3-0-6)')).toBe(6);
	});
});

describe('weeks', () => {
	it('week 1 is the semester start; week n is 7(n-1) days later', () => {
		expect(weekStart('2027-01-11', 1)).toBe('2027-01-11');
		expect(weekStart('2027-01-11', 8)).toBe('2027-03-01');
		expect(weekRange('2027-01-11', 1)).toEqual({ from: '2027-01-11', to: '2027-01-15' });
	});
});

describe('compare', () => {
	it('normalises titles like the database (edition parentheses, punctuation, case)', () => {
		expect(normTitle('Understanding Public Policy (15th ed.)')).toBe('understandingpublicpolicy');
	});
	it('finds the shared Shafritz & Hyde reading between 2400114 and 2404436', () => {
		const [a, b] = sharedReadings([s['2400114'], s['2404436']]);
		expect([...a]).toEqual(['r-2']);
		expect([...b]).toEqual(['r-2']);
	});
	it('finds shared concepts', () => {
		const shared = sharedConcepts([s['2400114'], s['2404436']]);
		expect(shared.has('bureaucracy')).toBe(true);
		expect(shared.has('classical organization theory')).toBe(true);
	});
	it('flags overlapping meetings only', () => {
		const tue = [{ weekday: 2, starts_at: '09:30', ends_at: '12:30' }];
		expect(clashes(tue, [{ weekday: 2, starts_at: '12:00', ends_at: '15:00' }])).toBe(true);
		expect(clashes(tue, [{ weekday: 2, starts_at: '12:30', ends_at: '15:30' }])).toBe(false);
		expect(clashes(tue, [{ weekday: 3, starts_at: '09:30', ends_at: '12:30' }])).toBe(false);
	});
});
