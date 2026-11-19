/** Dashboard numbers for Content Caution (spec 06 "UI"): tiles, matrix, kind bars, filters. Pure; unit-tested. */
export type CautionView = {
	id: string;
	kind: 'topic' | 'reading' | 'assignment' | 'objective';
	relation: 'duplicate' | 'builds_on' | 'related';
	severity: 'high' | 'medium' | 'info';
	status: 'open' | 'intentional' | 'coordinating' | 'dismissed';
	similarity: number;
	a_offering_id: string;
	b_offering_id: string;
	a_code: string;
	b_code: string;
	updated_at: string;
};

export type Filters = { severities: string[]; statuses: string[]; kind: string | null; course: string | null; pair: [string, string] | null; offering: string | null };

export const DEFAULT_FILTERS: Filters = { severities: ['high', 'medium'], statuses: ['open', 'coordinating'], kind: null, course: null, pair: null, offering: null };

export function parseFilters(q: URLSearchParams): Filters {
	const list = (k: string, d: string[]) => (q.has(k) ? q.get(k)!.split(',').filter(Boolean) : d);
	const pair = q.get('pair')?.split('|');
	return {
		severities: list('sev', DEFAULT_FILTERS.severities),
		statuses: list('status', DEFAULT_FILTERS.statuses),
		kind: q.get('kind') || null,
		course: q.get('course') || null,
		pair: pair && pair.length === 2 ? [pair[0], pair[1]] : null,
		offering: q.get('offering') || null
	};
}

export function applyFilters<T extends CautionView>(cs: T[], f: Filters): T[] {
	return cs.filter(
		(c) =>
			f.severities.includes(c.severity) &&
			f.statuses.includes(c.status) &&
			(!f.kind || c.kind === f.kind) &&
			(!f.course || c.a_code === f.course || c.b_code === f.course) &&
			(!f.pair || (c.a_code === f.pair[0] && c.b_code === f.pair[1]) || (c.a_code === f.pair[1] && c.b_code === f.pair[0])) &&
			(!f.offering || c.a_offering_id === f.offering || c.b_offering_id === f.offering)
	);
}

const SEV_RANK = { high: 3, medium: 2, info: 1 } as const;
export const bySeverity = <T extends CautionView>(a: T, b: T) => SEV_RANK[b.severity] - SEV_RANK[a.severity] || b.updated_at.localeCompare(a.updated_at);

/** เปิดอยู่ ระดับสูง · เปิดอยู่ ระดับกลาง · กำลังประสานงาน · ตัดสินแล้ว */
export function tiles(cs: CautionView[]) {
	return {
		high: cs.filter((c) => c.status === 'open' && c.severity === 'high').length,
		medium: cs.filter((c) => c.status === 'open' && c.severity === 'medium').length,
		coordinating: cs.filter((c) => c.status === 'coordinating').length,
		resolved: cs.filter((c) => c.status === 'intentional' || c.status === 'dismissed').length
	};
}

export type Cell = { count: number; worst: 'high' | 'medium' | 'info'; allResolved: boolean };

/**
 * Course × course matrix. Staff: rows and columns are every course with a caution in the filter.
 * Instructors (mine = their offering ids): their own courses as rows, the other courses as columns.
 */
export function matrix(cs: CautionView[], mine: string[] | null) {
	const cells = new Map<string, Cell>();
	const rows = new Set<string>();
	const cols = new Set<string>();
	for (const c of cs) {
		const sides: [string, string][] = [];
		if (!mine) sides.push([c.a_code, c.b_code], [c.b_code, c.a_code]);
		else {
			if (mine.includes(c.a_offering_id)) sides.push([c.a_code, c.b_code]);
			if (mine.includes(c.b_offering_id)) sides.push([c.b_code, c.a_code]);
		}
		for (const [r, k] of sides) {
			rows.add(r);
			cols.add(k);
			const key = `${r}|${k}`;
			const prev = cells.get(key) ?? { count: 0, worst: 'info', allResolved: true };
			const resolved = c.status === 'intentional' || c.status === 'dismissed';
			cells.set(key, { count: prev.count + 1, worst: SEV_RANK[c.severity] > SEV_RANK[prev.worst] ? c.severity : prev.worst, allResolved: prev.allResolved && resolved });
		}
	}
	const sort = (s: Set<string>) => [...s].sort();
	return { rows: sort(rows), cols: mine ? sort(cols) : sort(new Set([...rows, ...cols])), cell: (r: string, k: string) => cells.get(`${r}|${k}`) ?? null };
}

export function kindBars(cs: CautionView[]) {
	return (['topic', 'reading', 'assignment'] as const).map((kind) => ({
		kind,
		high: cs.filter((c) => c.kind === kind && c.severity === 'high').length,
		medium: cs.filter((c) => c.kind === kind && c.severity === 'medium').length,
		info: cs.filter((c) => c.kind === kind && c.severity === 'info').length
	}));
}
