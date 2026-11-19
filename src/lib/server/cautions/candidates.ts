/**
 * Stage 1 (rules) and Stage 2a (candidate pairs) — spec 06. Pure and deterministic: offline mode
 * replays them exactly, and the same input always gives the same candidates in the same order.
 */
import { tagSet } from '$lib/domain/concepts';
import type { Item } from '$lib/domain/items';
import { jaccard, normalize, trigrams } from '$lib/domain/normalize';

export type Offered = { offeringId: string; code: string; semester: string; name: string; items: Item[] };
export type Pair = { subject: Item; other: Item; otherOffering: Offered; score: number };
export type RulePair = Pair & { relation: 'duplicate' | 'related'; similarity: number; reasonTH: string; suggestionTH: string };

export const READING_REASON = 'ใช้เอกสารหลักเล่มเดียวกัน — ตรวจสอบว่ามอบหมายบทเดียวกันหรือไม่';
export const READING_SUGGESTION = 'ประสานกันเรื่องบทที่มอบหมาย อาจแบ่งบทกันอ่าน หรืออ้างอิงสิ่งที่นิสิตอ่านในอีกวิชาแล้ว';
export const TOPIC_REASON = 'หัวข้อประจำสัปดาห์เขียนเหมือนกันทุกตัวอักษร';
export const TOPIC_SUGGESTION = 'ตรวจสอบว่าสอนเนื้อหาเดียวกันหรือไม่ หากใช่ อาจปรับให้วิชาหนึ่งทบทวนสั้น ๆ แล้วต่อยอด';

/**
 * Course-admin weeks that read the same in every syllabus ("สรุปรายวิชา", "นำเสนอโครงงาน"…). Identical
 * text there says nothing about overlapping content, so the exact-match rule skips them.
 */
const GENERIC_TOPICS = new Set(
	[
		'แนะนำรายวิชา', 'ปฐมนิเทศรายวิชา', 'สรุปรายวิชา', 'สรุปรายวิชาและทบทวนก่อนสอบปลายภาค', 'ทบทวนก่อนสอบปลายภาค', 'ทบทวนก่อนสอบกลางภาค',
		'สอบกลางภาค', 'สอบปลายภาค', 'นำเสนอโครงงาน', 'นำเสนอโครงงานกลุ่ม', 'นำเสนอรายงาน', 'นำเสนอผลงาน', 'นำเสนองานกลุ่ม', 'ปรึกษางานรายบุคคล',
		'course introduction', 'introduction', 'review', 'final review', 'presentation', 'presentations', 'group presentations', 'midterm exam', 'final exam', 'wrap up'
	].map((t) => normalize(t))
);
export const isGenericTopic = (text: string) => GENERIC_TOPICS.has(normalize(text.split(' — ')[0]));

/** Stage 1: the same reading (any shared identifier) and identical normalised topic text */
export function rulePairs(subject: Offered, others: Offered[]): RulePair[] {
	const out: RulePair[] = [];
	for (const o of others)
		for (const s of subject.items)
			for (const x of o.items) {
				if (s.kind === 'reading' && x.kind === 'reading' && s.readingKeys?.some((k) => x.readingKeys?.includes(k)))
					out.push({ subject: s, other: x, otherOffering: o, score: 1, relation: 'related', similarity: 1, reasonTH: READING_REASON, suggestionTH: READING_SUGGESTION });
				else if (s.kind === 'topic' && x.kind === 'topic' && !isGenericTopic(s.text) && normalize(s.text.split(' — ')[0]) && normalize(s.text.split(' — ')[0]) === normalize(x.text.split(' — ')[0]))
					out.push({ subject: s, other: x, otherOffering: o, score: 1, relation: 'duplicate', similarity: 1, reasonTH: TOPIC_REASON, suggestionTH: TOPIC_SUGGESTION });
			}
	return out;
}

/** Stage 2a: shared concept tags or trigram similarity; top 40 by score, ties broken by refs */
export function candidatePairs(subject: Offered, others: Offered[], opts: { objectives?: boolean; limit?: number } = {}): Pair[] {
	const out: Pair[] = [];
	const tri = new Map<Item, Set<string>>();
	const tg = (i: Item) => tri.get(i) ?? (tri.set(i, trigrams(i.text)), tri.get(i)!);
	for (const o of others)
		for (const s of subject.items)
			for (const x of o.items) {
				if (s.kind !== x.kind || s.kind === 'reading') continue;
				const j = jaccard(tg(s), tg(x));
				if (s.kind === 'topic') {
					const a = tagSet(s.concepts);
					const b = tagSet(x.concepts);
					const shared = [...a].filter((t) => b.has(t)).length;
					if (shared === 0 && j < 0.35) continue;
					const tagScore = shared ? shared / Math.max(1, Math.min(a.size, b.size)) : 0;
					out.push({ subject: s, other: x, otherOffering: o, score: 0.6 * tagScore + 0.4 * j });
				} else if (s.kind === 'assignment') {
					const sameType = !!s.workType && s.workType === x.workType && s.workType !== 'other';
					if (!sameType && j < 0.3) continue;
					out.push({ subject: s, other: x, otherOffering: o, score: 0.6 * (sameType ? 1 : 0) + 0.4 * j });
				} else if (s.kind === 'objective' && opts.objectives) {
					if (!s.ploCodes?.some((p) => x.ploCodes?.includes(p)) || j < 0.4) continue;
					out.push({ subject: s, other: x, otherOffering: o, score: 0.4 * j });
				}
			}
	const key = (p: Pair) => `${p.otherOffering.code}@${p.otherOffering.semester}#${p.other.ref}|${p.subject.ref}`;
	return out.sort((a, b) => b.score - a.score || key(a).localeCompare(key(b))).slice(0, opts.limit ?? 40);
}
