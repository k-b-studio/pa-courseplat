/**
 * Comparable items from a SyllabusDoc — the same refs, texts and content hashes as
 * courseplat.rebuild_syllabus_items (0002), plus the fields Content Caution also needs
 * (work type, required reading, reading identifiers). A unit test keeps the two in step.
 */
import { createHash } from 'node:crypto';
import type { SyllabusDoc } from '$lib/schema/syllabus';
import { readingKeys } from './compare';

export type ItemKind = 'topic' | 'reading' | 'assignment' | 'objective';
export type Item = {
	kind: ItemKind;
	ref: string;
	week: number | null;
	text: string;
	concepts: string[];
	contentHash: string;
	workType?: string;
	required?: boolean;
	readingKeys?: string[];
	ploCodes?: string[];
};

const md5 = (s: string) => createHash('md5').update(s).digest('hex');

export function itemsFromDoc(doc: SyllabusDoc): Item[] {
	const out: Item[] = [];
	const seen = new Set<string>();
	const push = (i: Omit<Item, 'contentHash'>) => {
		if (seen.has(i.ref)) return; // a draft may repeat a week number (on conflict do nothing)
		seen.add(i.ref);
		out.push({ ...i, contentHash: md5(i.text + i.concepts.join(',')) });
	};
	for (const w of doc.weeklyPlan)
		if (!w.noClass && w.topic) push({ kind: 'topic', ref: `weeklyPlan:${w.week}`, week: w.week, text: w.topic + (w.details ? ` — ${w.details}` : ''), concepts: w.concepts });
	for (const r of doc.resources.readings)
		if (r.citation || r.title) push({ kind: 'reading', ref: `readings:${r.id}`, week: null, text: r.citation, concepts: [], required: r.required, readingKeys: readingKeys(r) });
	for (const x of doc.work)
		push({ kind: 'assignment', ref: `work:${x.id}`, week: x.dueWeek, text: `${x.title} — ${x.description} [${x.deliverable}]`, concepts: [], workType: x.type });
	for (const o of doc.objectives) if (o.text) push({ kind: 'objective', ref: `objectives:${o.id}`, week: null, text: o.text, concepts: [], ploCodes: o.ploCodes });
	return out;
}

/** "2404324 สัปดาห์ 4: ตัวแบบกระบวนการนโยบาย" (spec 06 R3) */
export function itemLabel(code: string, item: Item, workTitle?: string): string {
	const short = (s: string) => (s.length > 70 ? s.slice(0, 68) + '…' : s);
	if (item.kind === 'topic') return `${code} สัปดาห์ ${item.week}: ${short(item.text.split(' — ')[0])}`;
	if (item.kind === 'assignment') return `${code} งาน: ${short(workTitle ?? item.text.split(' — ')[0])}${item.week ? ` (ส่งสัปดาห์ ${item.week})` : ''}`;
	if (item.kind === 'reading') return `${code} เอกสาร: ${short(item.text)}`;
	return `${code} วัตถุประสงค์: ${short(item.text)}`;
}
