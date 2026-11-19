/** Small display helpers for people and week lists. Pure. */

/** Thai initials from "ชื่อ นามสกุล" (first letter of each, skipping leading vowels). */
export function initials(nameTh: string | null | undefined): string {
	if (!nameTh) return '';
	return nameTh
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((w) => [...w].find((ch) => /[ก-ฮA-Za-z]/.test(ch)) ?? '')
		.join('');
}

/** [1,2,3,5,7,8] → "1–3, 5, 7–8" */
export function weekRanges(weeks: number[]): string {
	const ws = [...new Set(weeks)].sort((a, b) => a - b);
	const out: string[] = [];
	for (let i = 0; i < ws.length; i++) {
		let j = i;
		while (j + 1 < ws.length && ws[j + 1] === ws[j] + 1) j++;
		out.push(i === j ? `${ws[i]}` : `${ws[i]}–${ws[j]}`);
		i = j;
	}
	return out.join(', ');
}
