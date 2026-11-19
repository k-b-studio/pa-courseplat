/**
 * Text normalisation for Content Caution (spec 06 Stage 1, AC 2): NFC, lower case, drop edition
 * notes and "สัปดาห์ที่ n" / "week n", then keep only a-z, 0-9 and Thai letters (no spaces or punctuation).
 */
export function normalize(s: string | null | undefined): string {
	return (s ?? '')
		.normalize('NFC')
		.toLowerCase()
		.replace(/\([^)]*\b(ed|eds|edition|edn)\b\.?[^)]*\)/gi, '')
		.replace(/สัปดาห์ที่\s*\d+|\bweek\s*\d+\b|\bwk\s*\d+\b/gi, '')
		.replace(/[^a-z0-9ก-๙]/g, '');
}

/** character trigrams of the normalised text */
export function trigrams(s: string): Set<string> {
	const n = normalize(s);
	const out = new Set<string>();
	for (let i = 0; i + 3 <= n.length; i++) out.add(n.slice(i, i + 3));
	return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
	if (!a.size || !b.size) return 0;
	let inter = 0;
	for (const x of a) if (b.has(x)) inter++;
	return inter / (a.size + b.size - inter);
}
