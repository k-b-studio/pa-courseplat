import { describe, expect, it } from 'vitest';
import { DEFAULT_FILTERS, applyFilters, kindBars, matrix, parseFilters, tiles, type CautionView } from '$lib/domain/cautionStats';

const c = (id: string, a: string, b: string, kind: CautionView['kind'], severity: CautionView['severity'], status: CautionView['status']): CautionView =>
	({ id, kind, relation: 'duplicate', severity, status, similarity: 0.8, a_offering_id: `o${a}`, b_offering_id: `o${b}`, a_code: a, b_code: b, updated_at: '2026-11-10' });
// the six seeded cautions of spec 08
const seeded = [
	c('1', '2404317', '2404416', 'assignment', 'high', 'open'),
	c('2', '2404312', '2404317', 'topic', 'medium', 'open'),
	c('3', '2400114', '2404436', 'topic', 'info', 'intentional'),
	c('4', '2404213', '2404422', 'topic', 'info', 'open'),
	c('5', '2400114', '2404436', 'reading', 'info', 'open'),
	c('6', '2400114', '2404324', 'topic', 'info', 'open')
];

describe('caution dashboard numbers (spec 06 AC 3)', () => {
	it('tiles: high 1, medium 1, coordinating 0, resolved 1', () => {
		expect(tiles(seeded)).toEqual({ high: 1, medium: 1, coordinating: 0, resolved: 1 });
	});
	it('default filters show the two open high/medium; info adds three; resolved shows all six', () => {
		expect(applyFilters(seeded, DEFAULT_FILTERS).map((x) => x.id)).toEqual(['1', '2']);
		expect(applyFilters(seeded, { ...DEFAULT_FILTERS, severities: ['high', 'medium', 'info'] })).toHaveLength(5);
		expect(applyFilters(seeded, { ...DEFAULT_FILTERS, severities: ['high', 'medium', 'info'], statuses: ['open', 'coordinating', 'intentional', 'dismissed'] })).toHaveLength(6);
	});
	it('matrix: red 2404317 × 2404416, amber 2404312 × 2404317', () => {
		const m = matrix(applyFilters(seeded, DEFAULT_FILTERS), null);
		expect(m.cell('2404317', '2404416')).toEqual({ count: 1, worst: 'high', allResolved: false });
		expect(m.cell('2404312', '2404317')?.worst).toBe('medium');
		expect(m.rows).toEqual(['2404312', '2404317', '2404416']);
	});
	it('instructors see their own courses as rows', () => {
		const m = matrix(seeded, ['o2404317']);
		expect(m.rows).toEqual(['2404317']);
		expect(m.cols).toEqual(['2404312', '2404416']);
	});
	it('filters come from the URL; kind bars split by severity', () => {
		const f = parseFilters(new URLSearchParams('sev=high&status=open&pair=2404416|2404317'));
		expect(applyFilters(seeded, f).map((x) => x.id)).toEqual(['1']);
		expect(kindBars(seeded).find((k) => k.kind === 'topic')).toEqual({ kind: 'topic', high: 0, medium: 1, info: 3 });
	});
});
