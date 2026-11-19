import { describe, expect, it } from 'vitest';
import { changedSections, diffDocs, isEmptyDiff } from '$lib/domain/diff';
import { syllabusSources } from '../../fixtures/syllabi/src/index';

const v2568 = syllabusSources['2568-2'].syllabi['2404324'];
const v2569 = syllabusSources['2569-2'].syllabi['2404324'];

describe('diff (spec 05 R10, AC 11)', () => {
	it('2404324 2/2568 → 2/2569: the behavioural-policy week and the new weights', () => {
		const d = diffDocs(v2568, v2569);
		expect(d.weeks.changed).toEqual([{ week: 12, from: 'การวิเคราะห์ผู้มีส่วนได้ส่วนเสียในกระบวนการนโยบาย', to: 'นโยบายเชิงพฤติกรรมและแนวคิด Nudge' }]);
		expect(d.evaluation.changed).toEqual(
			expect.arrayContaining([
				{ title: 'สอบกลางภาค', from: 30, to: 25 },
				{ title: 'Policy brief', from: 15, to: 20 },
				{ title: 'สอบปลายภาค', from: 35, to: 30 }
			])
		);
		expect(d.readings.added).toEqual(['Thaler, R. H., & Sunstein, C. R. (2021). Nudge: The final edition. Penguin Books.']);
		expect(d.readings.removed).toEqual([]);
		expect(d.focusChanged).toBe(true);
	});
	it('a document compared with itself has no differences', () => {
		expect(isEmptyDiff(diffDocs(v2569, v2569))).toBe(true);
		expect(changedSections(v2569, structuredClone(v2569))).toEqual([]);
	});
	it('lists the sections that differ', () => {
		const b = structuredClone(v2569);
		b.evaluation.items[0].weightPercent = 5;
		expect(changedSections(v2569, b)).toEqual(['evaluation']);
	});
});
