/**
 * Compare helpers (spec 04 R3). Pure; unit-tested. Students see only neutral "related topics"
 * built from the published documents themselves; nothing here reads Content Caution data.
 */
import type { Reading, SyllabusDoc } from '$lib/schema/syllabus';

/** Mirrors courseplat.norm_title (0002): NFC, lower case, drop "(… ed.)", keep a-z 0-9 Thai. */
export function normTitle(s: string | null | undefined): string {
	return (s ?? '')
		.normalize('NFC')
		.toLowerCase()
		.replace(/\([^)]*\b(ed|eds|edition|edn)\b\.?[^)]*\)/gi, '')
		.replace(/[^a-z0-9ก-๙]/g, '');
}

/** The identifiers a reading can match on (ISBN, DOI, normalised title), as in courseplat.reading_key. */
export function readingKeys(r: Pick<Reading, 'isbn' | 'doi' | 'title' | 'citation'>): string[] {
	const keys: string[] = [];
	const isbn = (r.isbn ?? '').replace(/[^0-9Xx]/g, '');
	if (isbn) keys.push(`isbn:${isbn}`);
	const doi = (r.doi ?? '').trim().toLowerCase();
	if (doi) keys.push(`doi:${doi}`);
	const t = normTitle(r.title || r.citation);
	if (t) keys.push(`t:${t}`);
	return keys;
}

/** For each column, the reading ids that also appear in another column. */
export function sharedReadings(docs: Pick<SyllabusDoc, 'resources'>[]): Set<string>[] {
	const keySets = docs.map((d) => d.resources.readings.map((r) => ({ id: r.id, keys: readingKeys(r) })));
	return keySets.map((mine, i) => {
		const others = new Set(keySets.flatMap((k, j) => (j === i ? [] : k.flatMap((x) => x.keys))));
		return new Set(mine.filter((r) => r.keys.some((k) => others.has(k))).map((r) => r.id));
	});
}

const normConcept = (c: string) => c.normalize('NFC').trim().toLowerCase();

/** Concept tags (and keywords) that appear in more than one compared course. */
export function sharedConcepts(docs: Pick<SyllabusDoc, 'weeklyPlan' | 'overview'>[]): Set<string> {
	const perDoc = docs.map((d) => new Set([...d.weeklyPlan.flatMap((w) => w.concepts), ...d.overview.keywords].map(normConcept).filter(Boolean)));
	const count = new Map<string, number>();
	for (const s of perDoc) for (const c of s) count.set(c, (count.get(c) ?? 0) + 1);
	return new Set([...count].filter(([, n]) => n > 1).map(([c]) => c));
}

export const isShared = (shared: Set<string>, concept: string) => shared.has(normConcept(concept));

export type Meeting = { weekday: number; starts_at: string; ends_at: string };

/** Overlapping weekly meetings between two sections ("เวลาเรียนชนกัน"). Times are HH:MM[:SS]. */
export function clashes(a: Meeting[], b: Meeting[]): boolean {
	return a.some((x) => b.some((y) => x.weekday === y.weekday && x.starts_at < y.ends_at && y.starts_at < x.ends_at));
}
