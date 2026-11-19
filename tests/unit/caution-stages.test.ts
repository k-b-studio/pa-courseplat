import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { normalizeTag } from '$lib/domain/concepts';
import { itemsFromDoc } from '$lib/domain/items';
import { normalize } from '$lib/domain/normalize';
import { clip } from '$lib/server/ai/judge';
import { candidatePairs, isGenericTopic, rulePairs, type Offered } from '$lib/server/cautions/candidates';
import { adjustRelation, dueNote, pairKey, severityFor } from '$lib/server/cautions/severity';
import type { SyllabusDoc } from '$lib/schema/syllabus';
import { syllabusSources } from '../../fixtures/syllabi/src/index';

describe('spec 06 AC 1 — pair keys, severity, relation adjustment', () => {
	const a = { code: '2404429', semester: '2569-2', ref: 'work:w-1' };
	const b = { code: '2404324', semester: '2569-2', ref: 'work:w-1' };
	it('pairKey is the same whichever side comes first', () => {
		expect(pairKey('assignment', a, b)).toBe(pairKey('assignment', b, a));
		expect(pairKey('assignment', a, b)).toBe('assignment|2404324@2569-2#work:w-1|2404429@2569-2#work:w-1');
	});
	it('severity table', () => {
		expect(severityFor({ kind: 'assignment', relation: 'duplicate', similarity: 0.8, sameSemester: true })).toBe('high');
		expect(severityFor({ kind: 'topic', relation: 'builds_on', similarity: 0.95, sameSemester: true })).toBe('info');
		expect(severityFor({ kind: 'topic', relation: 'duplicate', similarity: 0.78, sameSemester: true })).toBe('medium');
		expect(severityFor({ kind: 'reading', relation: 'related', similarity: 1, sameSemester: true, bothRequired: true })).toBe('medium');
		expect(dueNote({ kind: 'assignment', severity: 'high', sameSemester: true, weekA: 11, weekB: 12 })).toContain('ไม่เกิน 1 สัปดาห์');
	});
	it('a 2400114 × 2404436 duplicate becomes builds_on (levels 1 and 4); 2404324 × 2404429 stays', () => {
		expect(adjustRelation('duplicate', { code: '2400114', prerequisites: [] }, { code: '2404436', prerequisites: [] })).toEqual({ relation: 'builds_on', adjusted: true });
		expect(adjustRelation('duplicate', { code: '2404324', prerequisites: [] }, { code: '2404429', prerequisites: [] })).toEqual({ relation: 'duplicate', adjusted: false });
	});
});

describe('spec 06 AC 2 — normalisation', () => {
	it('drops edition notes, case, spaces and punctuation; keeps Thai letters', () => {
		expect(normalize('Understanding Public Policy (15th ed.)')).toBe(normalize('understanding public policy'));
		expect(normalize('สัปดาห์ที่ 4: ตัวแบบกระบวนการนโยบาย')).toBe('ตัวแบบกระบวนการนโยบาย');
		expect(normalizeTag('Stages-Models')).toBe(normalizeTag('policy cycle'));
	});
});

describe('spec 06 AC 10 — Stage 2a on the demo upload', () => {
	const sample = JSON.parse(readFileSync('fixtures/samples/2404429-source.json', 'utf-8')) as SyllabusDoc;
	const subject: Offered = { offeringId: 's', code: '2404429', semester: '2569-2', name: '', items: itemsFromDoc(sample) };
	// same semester (draft or published) + the latest published version of PA courses not offered then
	const others: Offered[] = [
		...Object.entries(syllabusSources['2569-2'].syllabi).map(([code, doc]) => ({ offeringId: code, code, semester: '2569-2', name: '', items: itemsFromDoc(doc) })),
		...Object.entries(syllabusSources['2569-1'].syllabi).map(([code, doc]) => ({ offeringId: code, code, semester: '2569-1', name: '', items: itemsFromDoc(doc) }))
	];
	const has = (pairs: { subject: { ref: string }; other: { ref: string }; otherOffering: { code: string } }[], s: string, code: string, o: string) => pairs.some((p) => p.subject.ref === s && p.otherOffering.code === code && p.other.ref === o);

	it('finds the five AI-judged pairs of spec 08 among at most 40 candidates, in a stable order', () => {
		const c = candidatePairs(subject, others);
		expect(c.length).toBeLessThanOrEqual(40);
		expect(has(c, 'work:w-1', '2404324', 'work:w-1')).toBe(true);
		expect(has(c, 'weeklyPlan:2', '2404324', 'weeklyPlan:4')).toBe(true);
		expect(has(c, 'weeklyPlan:2', '2404324', 'weeklyPlan:6')).toBe(true);
		expect(has(c, 'weeklyPlan:10', '2404318', 'weeklyPlan:3')).toBe(true);
		expect(has(c, 'weeklyPlan:12', '2404324', 'weeklyPlan:12')).toBe(true);
		expect(candidatePairs(subject, others).map((p) => `${p.subject.ref}>${p.otherOffering.code}:${p.other.ref}`)).toEqual(c.map((p) => `${p.subject.ref}>${p.otherOffering.code}:${p.other.ref}`));
	});
	it('Stage 1 finds the shared Dye reading deterministically', () => {
		const r = rulePairs(subject, others);
		expect(has(r, 'readings:r-1', '2404324', 'readings:r-1')).toBe(true);
	});
	it('Stage 1 ignores identical course-admin weeks such as "สรุปรายวิชา" (week 16 in five 1/2569 syllabi)', () => {
		const r = rulePairs(subject, others).filter((p) => p.subject.kind === 'topic');
		expect(r).toEqual([]);
		expect(isGenericTopic('สรุปรายวิชา')).toBe(true);
		expect(isGenericTopic('ทบทวนตัวแบบกระบวนการนโยบาย (Stages model)')).toBe(false);
	});
});

describe('clip (judge wording ≤ 200 characters)', () => {
	it('keeps short text and cuts long text at a space with an ellipsis', () => {
		expect(clip('สั้น ๆ')).toBe('สั้น ๆ');
		const long = Array.from({ length: 40 }, (_, i) => `คำที่${i}`).join(' ');
		const c = clip(long);
		expect(c.length).toBeLessThanOrEqual(200);
		expect(c.endsWith('…')).toBe(true);
		expect(long.startsWith(c.slice(0, -1))).toBe(true);
		expect(long[c.length - 1]).toBe(' ');
	});
});
