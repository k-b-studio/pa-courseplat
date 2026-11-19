/**
 * npm run fixtures:record [-- --part extract|caution] — record the offline fixtures from real runs
 * (spec 05 "Offline mode", spec 08 "Scripts"). Uses the free-tier quota: run once per phase.
 *
 * extract: the .docx sample (→ fixtures/extractions/2404429.json), the scanned PDF (checked for the
 *          same structure, spec 05 AC 2) and injection-test.docx (→ fixtures/extractions/injection-test.json).
 *          Prints the modelVersion to pin as AI_MODEL, and the spec 05 AC 1 / AC 9 checks.
 * caution: added with P5 (ThaiLLM judges the 2404429 candidate pairs).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import plosJson from '../data/plos-2569.json';
import { aiConfigFrom } from '../src/lib/server/ai/config';
import { extract, postProcess, type ExtractCtx, type ExtractInput } from '../src/lib/server/ai/extract';
import { AiError, type AiCallLog } from '../src/lib/server/ai/types';
import { docxToText } from '../src/lib/server/docx';
import type { ExtractionResult } from '../src/lib/schema/extraction';

const part = process.argv.includes('--part') ? process.argv[process.argv.indexOf('--part') + 1] : 'extract';
if (part !== 'extract') {
	console.log(`--part ${part}: not available yet`);
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
