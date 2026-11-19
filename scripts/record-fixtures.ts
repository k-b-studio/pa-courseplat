/**
 * npm run fixtures:record [-- --part extract|caution] — record the offline fixtures from real runs
 * (spec 05 "Offline mode", spec 08 "Scripts"). Uses the free-tier quota: run once per phase.
 *
 * extract: the .docx sample (→ fixtures/extractions/2404429.json), the scanned PDF (checked for the
 *          same structure, spec 05 AC 2) and injection-test.docx (→ fixtures/extractions/injection-test.json).
 *          Prints the modelVersion to pin as AI_MODEL, and the spec 05 AC 1 / AC 9 checks.
 * caution: Stage 2a over the accepted 2404429 draft against the seeded comparison set, then the ThaiLLM
 *          judge for the five spec 08 pairs (→ fixtures/cautions/2404429-2569-2.json). Spec 08 fixes which
 *          pairs and similarities the fixture holds, so severities stay deterministic; the AI supplies the
 *          Thai wording. --no-ai writes authored wording instead.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import plosJson from '../data/plos-2569.json';
import { aiConfigFrom } from '../src/lib/server/ai/config';
import { extract, postProcess, type ExtractCtx, type ExtractInput } from '../src/lib/server/ai/extract';
import { AiError, type AiCallLog } from '../src/lib/server/ai/types';
import { docxToText } from '../src/lib/server/docx';
import type { ExtractionResult } from '../src/lib/schema/extraction';

const part = process.argv.includes('--part') ? process.argv[process.argv.indexOf('--part') + 1] : 'extract';
if (part === 'caution') {
	await recordCautions(process.argv.includes('--no-ai'));
	process.exit(0);
}

const base = aiConfigFrom({ ...process.env, AI_OFFLINE: 'false', AI_EXTRACT_FALLBACK: 'none' });
if (!base.gemini.apiKey) {
	console.error('GEMINI_API_KEY is not set');
	process.exit(2);
}
// the instructors' names stay in instructorMentions; ids are mapped per offering at request time
const ctx: ExtractCtx = {
	course: { code: '2404429', name_th: 'การวิเคราะห์นโยบายสาธารณะชั้นสูง', name_en: 'Advanced Public Policy Analysis', credit_format: '3 (3-0-6)' },
	semesterLabel: '2/2569',
	weeks: 16,
	instructors: [],
	plos: plosJson.plos.map((p) => ({ code: p.code, text: p.textTH }))
};

const calls: AiCallLog[] = [];
const onCall = (l: AiCallLog) => void calls.push(l);
// alias first (spec 02), then the concrete free models if the alias isn't served
const candidates = [...new Set([base.gemini.model, 'gemini-3.6-flash', 'gemini-3.8-flash', 'gemini-3.5-flash-lite'])];
let model = candidates[0];

async function run(label: string, input: ExtractInput): Promise<{ result: ExtractionResult; version: string; seconds: number }> {
	for (const m of candidates.slice(candidates.indexOf(model))) {
		const cfg = { ...base, gemini: { ...base.gemini, model: m } };
		const t0 = Date.now();
		try {
			const out = await extract(cfg, input, ctx, onCall);
			model = m;
			const seconds = Math.round((Date.now() - t0) / 1000);
			console.log(`${label}: ok with ${m} (modelVersion ${out.model}) in ${seconds} s, tokens ${out.usage.input}/${out.usage.output}`);
			return { result: postProcess(out.result, ctx, input), version: out.model, seconds };
		} catch (e) {
			const code = e instanceof AiError ? e.code : 'error';
			console.log(`${label}: ${m} failed (${code}: ${String((e as Error).message).slice(0, 140)})`);
			if (code === 'quota') throw e; // don't burn the rest of the quota on other models
		}
	}
	throw new Error(`${label}: no model worked`);
}

const docxText = await docxToText(new Uint8Array(readFileSync('fixtures/samples/2404429-syllabus.docx')));
const main = await run('2404429-syllabus.docx', { kind: 'docx', text: docxText });
writeFileSync('fixtures/extractions/2404429.json', JSON.stringify(main.result, null, '\t') + '\n');

const d = main.result.doc;
const sum = d.evaluation.items.reduce((s, e) => s + e.weightPercent, 0);
const brief = d.work.find((w) => w.type === 'policy_brief' || /policy brief/i.test(w.title));
console.log('AC 1 checks:', {
	seconds: main.seconds,
	weeks: d.weeklyPlan.length,
	weightsSum: sum,
	dye: d.resources.readings.some((r) => /understanding public policy/i.test(r.title + r.citation)),
	policyBriefDueWeek: brief?.dueWeek ?? null,
	evaluationConfidence: main.result.meta.evaluation.confidence,
	weeklyPlanConfidence: main.result.meta.weeklyPlan.confidence,
	ploSuggestions: main.result.ploSuggestions.length
});

const pdf = readFileSync('fixtures/samples/2404429-syllabus-scan.pdf');
const scan = await run('2404429-syllabus-scan.pdf', { kind: 'pdf', mime: 'application/pdf', data: pdf.toString('base64') });
console.log('AC 2 checks (same structure as the .docx):', {
	weeks: [d.weeklyPlan.length, scan.result.doc.weeklyPlan.length],
	evaluationItems: [d.evaluation.items.length, scan.result.doc.evaluation.items.length]
});

const injText = await docxToText(new Uint8Array(readFileSync('fixtures/samples/injection-test.docx')));
const inj = await run('injection-test.docx', { kind: 'docx', text: injText });
writeFileSync('fixtures/extractions/injection-test.json', JSON.stringify(inj.result, null, '\t') + '\n');
console.log('AC 9 checks:', { weights: inj.result.doc.evaluation.items.map((e) => e.weightPercent), warnings: inj.result.warnings });

console.log(`\nPin AI_MODEL=${main.version || model} (the alias ${base.gemini.model} resolved to it). Calls: ${calls.map((c) => `${c.model}:${c.status}`).join(', ')}`);


// ---- caution part ------------------------------------------------------------------------------
async function recordCautions(noAi: boolean) {
	const { itemsFromDoc, itemLabel } = await import('../src/lib/domain/items');
	const { candidatePairs } = await import('../src/lib/server/cautions/candidates');
	const { judgePair } = await import('../src/lib/server/ai/judge');
	const { syllabusSources } = await import('../fixtures/syllabi/src/index');
	const coursesJson = (await import('../data/courses.json')).default as { courses: { code: string; nameTH: string }[] };
	const nameOf = (c: string) => coursesJson.courses.find((x) => x.code === c)?.nameTH ?? c;
	const draft = JSON.parse(readFileSync('fixtures/extractions/2404429.json', 'utf-8')) as ExtractionResult;
	const subject = { offeringId: 's', code: '2404429', semester: '2569-2', name: nameOf('2404429'), items: itemsFromDoc(draft.doc) };
	const others = [
		...Object.entries(syllabusSources['2569-2'].syllabi).map(([code, doc]) => ({ offeringId: code, code, semester: '2569-2', name: nameOf(code), items: itemsFromDoc(doc) })),
		...Object.entries(syllabusSources['2569-1'].syllabi).map(([code, doc]) => ({ offeringId: code, code, semester: '2569-1', name: nameOf(code), items: itemsFromDoc(doc) }))
	];
	const candidates = candidatePairs(subject, others);
	// spec 08 "Expected cautions after the run"
	const SPEC = [
		{ s: 'work:w-1', c: '2404324', o: 'work:w-1', relation: 'duplicate', similarity: 0.88, reasonTH: 'งาน policy brief วิเคราะห์ปัญหานโยบายไทย 1 ประเด็น ความยาว 2 หน้า ซ้ำกับงาน policy brief ของ 2404324', suggestionTH: 'อาจปรับงานของ 2404429 เป็น options memo เปรียบเทียบทางเลือกนโยบาย หรือให้ต่อยอดจาก policy brief ที่นิสิตทำใน 2404324' },
		{ s: 'weeklyPlan:2', c: '2404324', o: 'weeklyPlan:4', relation: 'duplicate', similarity: 0.84, reasonTH: 'ทบทวนตัวแบบขั้นตอนนโยบาย (Stages model) ซึ่งสอนแล้วใน 2404324 สัปดาห์ที่ 4', suggestionTH: 'อาจลดเวลาทบทวนเหลือ 30 นาที และอ้างอิงเนื้อหาจาก 2404324 สัปดาห์ 4' },
		{ s: 'weeklyPlan:2', c: '2404324', o: 'weeklyPlan:6', relation: 'duplicate', similarity: 0.8, reasonTH: 'ทบทวนกระแสหลายสาย (Multiple Streams) ซึ่งเป็นหัวข้อหลักของ 2404324 สัปดาห์ที่ 6', suggestionTH: 'ทบทวนสั้น ๆ แล้วใช้กรอบนี้วิเคราะห์กรณีจริงแทนการบรรยายซ้ำ' },
		{ s: 'weeklyPlan:10', c: '2404318', o: 'weeklyPlan:3', relation: 'duplicate', similarity: 0.78, reasonTH: 'ตัวแบบเชิงตรรกะ (Logic model) และตัวชี้วัดสอนใน 2404318 สัปดาห์ที่ 3 เช่นกัน', suggestionTH: 'ประสานกับผู้สอน 2404318 เพื่อแบ่งความลึก เช่น 2404429 เน้นการใช้ตัวแบบประเมินนโยบายกับกรณีจริง' },
		{ s: 'weeklyPlan:12', c: '2404324', o: 'weeklyPlan:12', relation: 'related', similarity: 0.7, reasonTH: 'ทั้งสองวิชามีหัวข้อนโยบายเชิงพฤติกรรม (nudge) ในสัปดาห์ที่ 12', suggestionTH: 'อาจให้ 2404429 เน้นการออกแบบการทดลองเชิงนโยบาย ต่อจากแนวคิด nudge ใน 2404324' }
	] as const;
	const thai = aiConfigFrom({ ...process.env, AI_OFFLINE: 'false' });
	const judgements = [];
	for (const p of SPEC) {
		const c = candidates.find((x) => x.subject.ref === p.s && x.otherOffering.code === p.c && x.other.ref === p.o);
		if (!c) throw new Error(`Stage 2a did not produce ${p.s} × ${p.c} ${p.o}`);
		let reasonTH: string = p.reasonTH;
		let suggestionTH: string = p.suggestionTH;
		let wording: 'thaillm' | 'authored' = 'authored';
		if (!noAi) {
			const j = await judgePair(thai, {
				a: { code: subject.code, name: subject.name, level: 4, semester: '2569-2', label: itemLabel(subject.code, c.subject), text: c.subject.text },
				b: { code: c.otherOffering.code, name: c.otherOffering.name, level: Number(c.otherOffering.code[4]), semester: c.otherOffering.semester, label: itemLabel(c.otherOffering.code, c.other), text: c.other.text },
				prerequisite: null
			}, () => {});
			console.log(`${p.s} × ${p.c} ${p.o}: judge says ${j.relation} ${j.similarity} (spec: ${p.relation} ${p.similarity})`);
			// take ThaiLLM's wording only when it agrees with spec 08's relation, so the text never contradicts the label
			if (j.overlap && j.relation === p.relation && j.reasonTH.trim() && j.suggestionTH.trim()) ((reasonTH = j.reasonTH), (suggestionTH = j.suggestionTH), (wording = 'thaillm'));
		}
		judgements.push({ subjectRef: p.s, subjectHash: c.subject.contentHash, otherCourse: p.c, otherSemester: c.otherOffering.semester, otherRef: p.o, otherHash: c.other.contentHash, overlap: true, similarity: p.similarity, relation: p.relation, reasonTH, suggestionTH, wording });
	}
	writeFileSync('fixtures/cautions/2404429-2569-2.json', JSON.stringify({ _note: 'Judgements for the demo upload of 2404429 in 2/2569, keyed by both items\' content hashes (spec 06). Pairs and similarities follow spec 08 so severities are deterministic; wording ' + (noAi ? 'authored' : `from ThaiLLM ${thai.thaillm.model} where it gave spec 08's relation (${judgements.filter((j) => j.wording === 'thaillm').length}/${judgements.length}), authored otherwise`) + '.', subject: { course: '2404429', semester: '2569-2' }, judgements }, null, '\t') + '\n');
	console.log(`candidates: ${candidates.length}; wrote ${judgements.length} judgements`);
}
