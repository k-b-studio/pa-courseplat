/**
 * One Content Caution run (spec 06 pipeline). The caller has already checked can_edit_offering
 * with the user's JWT; reads and writes here use the secret-key client.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { itemLabel, itemsFromDoc, type Item } from '$lib/domain/items';
import type { SyllabusDoc } from '$lib/schema/syllabus';
import type { AiConfig } from '../ai/config';
import type { ProviderDeps } from '../ai/generate';
import { clip, compareCorpus, judgePair, type JudgeResult } from '../ai/judge';
import type { OnCall } from '../ai/types';
import { candidatePairs, rulePairs, type Offered, type Pair } from './candidates';
import { ADJUST_NOTE, adjustRelation, canonical, dueNote, pairKey, severityFor, type Kind, type Relation, type Severity } from './severity';

type DB = SupabaseClient<any, 'courseplat'>;
export type Judgement = { subjectRef: string; subjectHash: string; otherCourse: string; otherSemester: string; otherRef: string; otherHash: string } & JudgeResult;
export type CautionFixture = { judgements: Judgement[] };
export type RunDeps = { ai?: ProviderDeps; fixture?: (code: string, semester: string) => CautionFixture | null; onCall?: OnCall };
export type RunSummary = { runId: string; produced: number; created: number; reopened: number; dismissed: number; aiFailed: boolean; offline: boolean };

export const REOPEN_NOTE = 'เนื้อหาเปลี่ยนแปลงหลังการตัดสินใจ';
export const AUTO_DISMISS_NOTE = 'ไม่พบความทับซ้อนนี้ในการตรวจครั้งล่าสุด';

type Facts = { code: string; name: string; prerequisites: string[] };
type Found = { kind: Kind; subject: Item; other: Item; o: Offered; relation: Relation; similarity: number; reason: string; suggestion: string; source: 'rule' | 'ai' };

const docOf = (x: unknown) => (x && typeof x === 'object' ? (x as SyllabusDoc) : null);

/** the subject plus its comparison set (spec 06 R1) */
async function load(db: DB, offeringId: string) {
	const { data: subj, error } = await db.from('offerings').select('id, course_code, semester_id, syllabus, semester:semesters(label)').eq('id', offeringId).single();
	if (error || !subj) throw new Error('offering not found');
	const code = subj.course_code.trim();
	const semester = subj.semester_id as string;
	const { data: coursesRows } = await db.from('courses').select('code, name_th, prerequisite_codes, managed_here, department');
	const facts = new Map<string, Facts & { managed: boolean; dept: string }>(
		((coursesRows ?? []) as any[]).map((c) => [c.code.trim(), { code: c.code.trim(), name: c.name_th, prerequisites: (c.prerequisite_codes ?? []).map((x: string) => x.trim()), managed: c.managed_here, dept: c.department }])
	);
	const toOffered = (id: string, c: string, sem: string, doc: SyllabusDoc | null): Offered => ({ offeringId: id, code: c, semester: sem, name: facts.get(c)?.name ?? c, items: doc ? itemsFromDoc(doc) : [] });

	const subject = toOffered(subj.id, code, semester, docOf(subj.syllabus));
	const { data: same } = await db.from('offerings').select('id, course_code, syllabus').eq('semester_id', semester).neq('id', offeringId).in('status', ['draft', 'published']);
	const others: Offered[] = ((same ?? []) as any[]).filter((o) => o.syllabus).map((o) => toOffered(o.id, o.course_code.trim(), semester, docOf(o.syllabus)));

	// PA courses not offered this semester: their most recent published version
	const { data: offeredNow } = await db.from('offerings').select('course_code').eq('semester_id', semester);
	const now = new Set(((offeredNow ?? []) as any[]).map((o) => o.course_code.trim()));
	const { data: pub } = await db.from('offerings').select('id, course_code, semester_id, published_revision').eq('status', 'published').neq('semester_id', semester).order('semester_id', { ascending: false });
	const latest = new Map<string, { id: string; semester_id: string; published_revision: number }>();
	for (const o of (pub ?? []) as any[]) {
		const c = o.course_code.trim();
		if (c === code || now.has(c) || latest.has(c) || !facts.get(c)?.managed) continue;
		latest.set(c, o);
	}
	if (latest.size) {
		const { data: vs } = await db.from('offering_versions').select('offering_id, revision, syllabus').in('offering_id', [...latest.values()].map((o) => o.id));
		for (const [c, o] of latest) {
			const v = ((vs ?? []) as any[]).find((x) => x.offering_id === o.id && x.revision === o.published_revision);
			if (v) others.push(toOffered(o.id, c, o.semester_id, docOf(v.syllabus)));
		}
	}
	return { subject, others, facts, semesterLabel: (subj as any).semester?.label ?? semester };
}

function corpusOf(subject: Offered, others: Offered[], semesterLabel: string, facts: Map<string, Facts>): string {
	const line = (id: string, i: Item) =>
		`${id}#${i.ref} | ${i.week ? `wk${i.week}` : '-'} | ${i.text.replace(/\s+/g, ' ').slice(0, 300)}${i.concepts.length ? ` | concepts: ${i.concepts.join('; ')}` : ''}`;
	const items = (o: Offered) => o.items.filter((i) => i.kind !== 'objective');
	const head = (tag: string, o: Offered, id?: string) => `<${tag}${id ? ` id="${id}"` : ''} course="${o.code}" semester="${o.semester}" name="${o.name}" level="${o.code[4]}" prerequisites="${(facts.get(o.code)?.prerequisites ?? []).join(',')}">`;
	return [
		`${head('subject', subject)}`.replace(`semester="${subject.semester}"`, `semester="${semesterLabel}"`),
		...items(subject).map((i) => line('S', i)),
		'</subject>',
		...others.flatMap((o, n) => [head('course', o, `C${n + 1}`), ...items(o).map((i) => line(`C${n + 1}`, i)), '</course>'])
	].join('\n');
}

export async function runCautions(db: DB, opts: { offeringId: string; userId: string | null; trigger: 'manual' | 'save' | 'publish' | 'import' | 'seed'; cfg: AiConfig }, deps: RunDeps = {}): Promise<RunSummary> {
	const { subject, others, facts, semesterLabel } = await load(db, opts.offeringId);
	const { data: run } = await db
		.from('caution_runs')
		.insert({ offering_id: opts.offeringId, triggered_by: opts.userId, trigger: opts.trigger, status: 'running', offline: opts.cfg.offline, compared_offering_ids: others.map((o) => o.offeringId), model: opts.cfg.offline ? 'offline-fixture' : opts.cfg.cautionProvider === 'gemini' ? opts.cfg.gemini.model : opts.cfg.thaillm.model })
		.select('id')
		.single();
	const runId = run!.id as string;
	const found: Found[] = [];
	let aiFailed = false;
	let aiError: string | null = null;

	try {
		// Stage 1: rules
		for (const p of rulePairs(subject, others)) found.push({ kind: p.subject.kind as Kind, subject: p.subject, other: p.other, o: p.otherOffering, relation: p.relation, similarity: p.similarity, reason: p.reasonTH, suggestion: p.suggestionTH, source: 'rule' });

		// Stage 2a + 2b
		const candidates = candidatePairs(subject, others);
		const accept = (c: Pair, j: JudgeResult) => {
			if (!j.overlap || j.relation === 'none' || j.similarity < 0.6) return;
			found.push({ kind: c.subject.kind as Kind, subject: c.subject, other: c.other, o: c.otherOffering, relation: j.relation, similarity: j.similarity, reason: j.reasonTH, suggestion: j.suggestionTH, source: 'ai' });
		};
		if (opts.cfg.offline) {
			const fx = deps.fixture?.(subject.code, subject.semester);
			const byHash = new Map((fx?.judgements ?? []).map((j) => [`${j.subjectRef}|${j.subjectHash}|${j.otherCourse}|${j.otherRef}|${j.otherHash}`, j]));
			for (const c of candidates) {
				const j = byHash.get(`${c.subject.ref}|${c.subject.contentHash}|${c.otherOffering.code}|${c.other.ref}|${c.other.contentHash}`);
				if (j) accept(c, j);
			}
		} else if (candidates.length) {
			const onCall = deps.onCall ?? (() => {});
			let useGemini = opts.cfg.cautionProvider === 'gemini';
			if (!useGemini) {
				const results = await Promise.allSettled(
					candidates.map((c) =>
						judgePair(
							opts.cfg,
							{
								a: { code: subject.code, name: subject.name, level: Number(subject.code[4]), semester: subject.semester, label: itemLabel(subject.code, c.subject), text: c.subject.text },
								b: { code: c.otherOffering.code, name: c.otherOffering.name, level: Number(c.otherOffering.code[4]), semester: c.otherOffering.semester, label: itemLabel(c.otherOffering.code, c.other), text: c.other.text },
								prerequisite: prereqText(facts, subject.code, c.otherOffering.code)
							},
							onCall,
							deps.ai
						)
					)
				);
				const failures = results.filter((r) => r.status === 'rejected').length;
				results.forEach((r, i) => r.status === 'fulfilled' && accept(candidates[i], r.value));
				// ThaiLLM unreachable or failing for most pairs → the Gemini corpus comparison (spec 06)
				if (failures > candidates.length / 2) {
					found.splice(0, found.length, ...found.filter((f) => f.source === 'rule'));
					useGemini = true;
				}
			}
			if (useGemini) {
				try {
					const out = await compareCorpus(opts.cfg, corpusOf(subject, others, semesterLabel, facts), onCall, deps.ai);
					for (const p of out.pairs) {
						const s = subject.items.find((i) => `S#${i.ref}` === p.subjectRef);
						const m = /^C(\d+)#(.+)$/.exec(p.otherRef);
						const o = m ? others[Number(m[1]) - 1] : undefined;
						const x = o?.items.find((i) => i.ref === m![2]);
						if (!s || !o || !x || s.kind !== x.kind || s.kind === 'reading' || p.similarity < 0.6) continue;
						found.push({ kind: s.kind as Kind, subject: s, other: x, o, relation: p.relation, similarity: p.similarity, reason: clip(p.reasonTH), suggestion: clip(p.suggestionTH), source: 'ai' });
					}
				} catch (e) {
					aiFailed = true;
					aiError = (e as Error).message.slice(0, 300);
				}
			}
		}

		// Stage 3 + upsert
		const rows = stage3(found, subject, facts);
		// when the AI part failed, the run only re-checked the rules: don't dismiss what the AI found earlier
		const counts = await upsert(db, rows, subject, runId, { keepAi: aiFailed });
		await db.from('caution_runs').update({ status: aiFailed ? 'failed' : 'succeeded', error: aiError, finished_at: new Date().toISOString() }).eq('id', runId);
		return { runId, produced: rows.length, ...counts, aiFailed, offline: opts.cfg.offline };
	} catch (e) {
		await db.from('caution_runs').update({ status: 'failed', error: (e as Error).message.slice(0, 300), finished_at: new Date().toISOString() }).eq('id', runId);
		throw e;
	}
}

function prereqText(facts: Map<string, Facts>, a: string, b: string): string | null {
	if (facts.get(a)?.prerequisites.includes(b)) return `${b} is a prerequisite of ${a}`;
	if (facts.get(b)?.prerequisites.includes(a)) return `${a} is a prerequisite of ${b}`;
	return null;
}

export type CautionRow = {
	pair_key: string;
	semester_id: string;
	a_offering_id: string;
	a_ref: string;
	a_label: string;
	a_hash: string;
	b_offering_id: string;
	b_ref: string;
	b_label: string;
	b_hash: string;
	kind: Kind;
	relation: Relation;
	severity: Severity;
	similarity: number;
	reason_th: string;
	suggestion_th: string;
	source: 'rule' | 'ai' | 'seed';
};

/** Stage 3 — relation adjustment, severity, due-week note, canonical sides (spec 06) */
export function stage3(found: Found[], subject: Offered, facts: Map<string, Facts>): CautionRow[] {
	const rows = new Map<string, CautionRow>();
	for (const f of found) {
		const fa = facts.get(subject.code) ?? { code: subject.code, name: '', prerequisites: [] };
		const fb = facts.get(f.o.code) ?? { code: f.o.code, name: '', prerequisites: [] };
		const adj = adjustRelation(f.relation, fa, fb);
		const sameSemester = f.o.semester === subject.semester;
		const severity = severityFor({ kind: f.kind, relation: adj.relation, similarity: f.similarity, sameSemester, bothRequired: !!f.subject.required && !!f.other.required });
		const reason = (f.reason + (adj.adjusted ? ADJUST_NOTE : '') + dueNote({ kind: f.kind, severity, sameSemester, weekA: f.subject.week, weekB: f.other.week })).slice(0, 400);
		const sideS = { code: subject.code, semester: subject.semester, ref: f.subject.ref, offeringId: subject.offeringId, item: f.subject };
		const sideO = { code: f.o.code, semester: f.o.semester, ref: f.other.ref, offeringId: f.o.offeringId, item: f.other };
		const [a, b] = canonical(sideS, sideO);
		const key = pairKey(f.kind, a, b);
		const row: CautionRow = {
			pair_key: key,
			semester_id: subject.semester,
			a_offering_id: a.offeringId,
			a_ref: a.ref,
			a_label: itemLabel(a.code, a.item),
			a_hash: a.item.contentHash,
			b_offering_id: b.offeringId,
			b_ref: b.ref,
			b_label: itemLabel(b.code, b.item),
			b_hash: b.item.contentHash,
			kind: f.kind,
			relation: adj.relation,
			severity,
			similarity: Math.round(f.similarity * 100) / 100,
			reason_th: reason,
			suggestion_th: f.suggestion.slice(0, 400),
			source: f.source
		};
		const prev = rows.get(key);
		if (!prev || prev.similarity < row.similarity) rows.set(key, row);
	}
	return [...rows.values()];
}

/** by pair_key: insert new as open; refresh open/coordinating; reopen resolved ones whose content changed; auto-dismiss the rest (R5–R7) */
export async function upsert(db: DB, rows: CautionRow[], subject: Pick<Offered, 'offeringId'>, runId: string | null, opts: { keepAi?: boolean } = {}) {
	let created = 0;
	let reopened = 0;
	const now = new Date().toISOString();
	const keys = rows.map((r) => r.pair_key);
	const { data: existing } = keys.length ? await db.from('content_cautions').select('id, pair_key, status, a_hash, b_hash').in('pair_key', keys) : { data: [] };
	const byKey = new Map(((existing ?? []) as { id: string; pair_key: string; status: string; a_hash: string; b_hash: string }[]).map((e) => [e.pair_key, e]));
	for (const r of rows) {
		const e = byKey.get(r.pair_key);
		if (!e) {
			await db.from('content_cautions').insert({ ...r, status: 'open', last_run_id: runId, updated_at: now });
			created++;
		} else if (e.status === 'open' || e.status === 'coordinating') {
			await db.from('content_cautions').update({ ...r, last_run_id: runId, updated_at: now }).eq('id', e.id);
		} else if (e.a_hash !== r.a_hash || e.b_hash !== r.b_hash) {
			await db.from('content_cautions').update({ ...r, status: 'open', resolved_by: null, resolved_at: null, resolution_note: REOPEN_NOTE, last_run_id: runId, updated_at: now }).eq('id', e.id);
			await db.from('caution_events').insert({ caution_id: e.id, actor_id: null, status: 'open', note: REOPEN_NOTE });
			reopened++;
		}
	}
	// R7: open (or still-coordinating) cautions of this offering that this run didn't produce; seeded ones stay
	const { data: stale } = await db
		.from('content_cautions')
		.select('id, pair_key, source')
		.or(`a_offering_id.eq.${subject.offeringId},b_offering_id.eq.${subject.offeringId}`)
		.in('status', ['open', 'coordinating'])
		.neq('source', 'seed');
	const gone = ((stale ?? []) as { id: string; pair_key: string; source: string }[]).filter((s) => !keys.includes(s.pair_key) && !(opts.keepAi && s.source === 'ai'));
	for (const s of gone) {
		await db.from('content_cautions').update({ status: 'dismissed', resolution_note: AUTO_DISMISS_NOTE, resolved_at: now, resolved_by: null, last_run_id: runId, updated_at: now }).eq('id', s.id);
		await db.from('caution_events').insert({ caution_id: s.id, actor_id: null, status: 'dismissed', note: AUTO_DISMISS_NOTE });
	}
	return { created, reopened, dismissed: gone.length };
}
