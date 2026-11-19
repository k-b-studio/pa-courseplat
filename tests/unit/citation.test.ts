import { describe, expect, it } from 'vitest';
import { parseCitation } from '$lib/domain/citation';

describe('citation splitter (spec 05 R4)', () => {
	it('splits an APA book citation', () => {
		expect(parseCitation('Dye, T. R. (2017). Understanding public policy (15th ed.). Pearson.')).toMatchObject({ authors: 'Dye, T. R.', year: 2017, title: 'Understanding public policy', type: 'book' });
	});
	it('recognises a journal article', () => {
		expect(parseCitation('Hood, C. (1991). A public management for all seasons? Public Administration, 69(1), 3–19.')).toMatchObject({ authors: 'Hood, C.', year: 1991, type: 'article' });
	});
	it('handles a Thai citation without a year', () => {
		expect(parseCitation('ศุภชัย ยาวะประภาษ. นโยบายสาธารณะ. สำนักพิมพ์แห่งจุฬาลงกรณ์มหาวิทยาลัย.')).toMatchObject({ authors: 'ศุภชัย ยาวะประภาษ', title: 'นโยบายสาธารณะ', year: null, type: 'book' });
	});
	it('marks Thai laws and keeps DOIs', () => {
		expect(parseCitation('พระราชบัญญัติวิธีการงบประมาณ พ.ศ. 2561.').type).toBe('law');
		expect(parseCitation('Smith, J. (2020). A study. Journal, 1(2), 3–4. https://doi.org/10.1000/xyz123').doi).toBe('10.1000/xyz123');
	});
});
