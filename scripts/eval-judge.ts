/**
 * npm run eval:judge [-- --models typhoon,pathumma,openthaigpt] — choose the ThaiLLM model for the
 * caution judge (spec 06 "Choosing the ThaiLLM model"). Positives: the six expected 2404429 pairs of
 * spec 08; negatives: twelve plausible non-overlaps from the seed data. A model passes if it finds the
 * high assignment pair, at least four of the other five positives, and has at most two false positives.
 * A call that fails (no valid JSON after the repair retry) is an error, not a correct "no": more than
 * one failed call disqualifies a model. Among passing models, fewer false positives win, then recall
 * (professors must trust the cautions), then how many positives get spec 08's relation. Writes fixtures/eval/judge-<model>.json and summary.json.
 * --from-files recomputes the summary from saved results without calling ThaiLLM.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import coursesJson from '../data/courses.json';
import { itemLabel, itemsFromDoc, type Item } from '../src/lib/domain/items';
import type { SyllabusDoc } from '../src/lib/schema/syllabus';
import { aiConfigFrom } from '../src/lib/server/ai/config';
import { judgePair } from '../src/lib/server/ai/judge';
import { resetFormatMode } from '../src/lib/server/ai/providers/thaillm';
import { syllabusSources } from '../fixtures/syllabi/src/index';

const arg = process.argv.indexOf('--models');
const models = (arg > 0 ? process.argv[arg + 1] : 'typhoon,pathumma,openthaigpt').split(',');
const name = (c: string) => (coursesJson.courses as { code: string; nameTH: string }[]).find((x) => x.code === c)?.nameTH ?? c;
const draft = JSON.parse(readFileSync('fixtures/extractions/2404429.json', 'utf-8')).doc as SyllabusDoc;
const docs: Record<string, SyllabusDoc> = { '2404429': draft, ...syllabusSources['2569-2'].syllabi };
const item = (code: string, ref: string): Item => {
	const it = itemsFromDoc(docs[code]).find((i) => i.ref === ref);
	if (!it) throw new Error(`${code} ${ref} not found`);
	return it;
};

type Case = { id: string; a: [string, string]; b: [string, string]; positive: boolean; high?: boolean; expect?: 'duplicate' | 'related' };
const CASES: Case[] = [
	{ id: 'P1 policy brief × policy brief', a: ['2404429', 'work:w-1'], b: ['2404324', 'work:w-1'], positive: true, expect: 'duplicate', high: true },
	{ id: 'P2 wk2 stages model × 2404324 wk4', a: ['2404429', 'weeklyPlan:2'], b: ['2404324', 'weeklyPlan:4'], positive: true, expect: 'duplicate' },
	{ id: 'P3 wk2 multiple streams × 2404324 wk6', a: ['2404429', 'weeklyPlan:2'], b: ['2404324', 'weeklyPlan:6'], positive: true, expect: 'duplicate' },
	{ id: 'P4 wk10 logic model × 2404318 wk3', a: ['2404429', 'weeklyPlan:10'], b: ['2404318', 'weeklyPlan:3'], positive: true, expect: 'duplicate' },
	{ id: 'P5 wk12 behavioural × 2404324 wk12', a: ['2404429', 'weeklyPlan:12'], b: ['2404324', 'weeklyPlan:12'], positive: true, expect: 'related' },
	{ id: 'P6 Dye × Dye', a: ['2404429', 'readings:r-1'], b: ['2404324', 'readings:r-1'], positive: true },
	{ id: 'N1 PM2.5 case × UHC case', a: ['2404429', 'weeklyPlan:13'], b: ['2404324', 'weeklyPlan:13'], positive: false },
	{ id: 'N2 budget cycle × HR planning', a: ['2404422', 'weeklyPlan:2'], b: ['2404317', 'weeklyPlan:2'], positive: false },
	{ id: 'N3 cost-benefit × public expenditure', a: ['2404429', 'weeklyPlan:5'], b: ['2404213', 'weeklyPlan:3'], positive: false },
	{ id: 'N4 qualitative interviews × chi-square', a: ['2404429', 'weeklyPlan:7'], b: ['2404368', 'weeklyPlan:11'], positive: false },
	{ id: 'N5 policy communication × appraisal', a: ['2404429', 'weeklyPlan:14'], b: ['2404312', 'weeklyPlan:9'], positive: false },
	{ id: 'N6 implementation analysis × training design', a: ['2404429', 'weeklyPlan:9'], b: ['2404416', 'weeklyPlan:4'], positive: false },
	{ id: 'N7 options project × data project', a: ['2404429', 'work:w-2'], b: ['2404368', 'work:w-2'], positive: false },
	{ id: 'N8 problem definition × organisational power', a: ['2404429', 'weeklyPlan:3'], b: ['2404436', 'weeklyPlan:7'], positive: false },
	{ id: 'N9 stakeholder analysis × taxation', a: ['2404429', 'weeklyPlan:6'], b: ['2404213', 'weeklyPlan:4'], positive: false },
	{ id: 'N10 impact evaluation × gender budgeting', a: ['2404429', 'weeklyPlan:11'], b: ['2404422', 'weeklyPlan:11'], positive: false },
	{ id: 'N11 course intro × course intro', a: ['2404429', 'weeklyPlan:1'], b: ['2404312', 'weeklyPlan:1'], positive: false },
	{ id: 'N12 evaluative criteria × probability', a: ['2404429', 'weeklyPlan:4'], b: ['2404368', 'weeklyPlan:6'], positive: false }
];

mkdirSync('fixtures/eval', { recursive: true });
const summary: { model: string; pass: boolean; precision: number; recall: number; fp: number; failedCalls: number; relationMatches: number }[] = [];
const fromFiles = process.argv.includes('--from-files');
for (const model of models) {
	if (fromFiles) {
		const saved = JSON.parse(readFileSync(`fixtures/eval/judge-${model}.json`, 'utf-8'));
		score(model, saved.results);
		continue;
	}
	resetFormatMode();
	const cfg = { ...aiConfigFrom({ ...process.env, AI_OFFLINE: 'false' }), offline: false };
	cfg.thaillm = { ...cfg.thaillm, model };
	const results = [];
	let failed = 0;
	for (const c of CASES) {
		const [ia, ib] = [item(...c.a), item(...c.b)];
		const side = (code: string, it: Item) => ({ code, name: name(code), level: Number(code[4]), semester: '2569-2', label: itemLabel(code, it), text: it.text });
		const t0 = Date.now();
		try {
			const j = await judgePair(cfg, { a: side(c.a[0], ia), b: side(c.b[0], ib), prerequisite: null }, () => {});
			const predicted = j.overlap && j.relation !== 'none' && j.similarity >= 0.6;
			results.push({ case: c.id, positive: c.positive, predicted, relation: j.relation, similarity: j.similarity, ...(c.expect ? { expected: c.expect, relationMatches: predicted && j.relation === c.expect } : {}), reasonTH: j.reasonTH, ms: Date.now() - t0 });
		} catch (e) {
			failed++;
			results.push({ case: c.id, positive: c.positive, predicted: false, error: (e as Error).message.slice(0, 160), ms: Date.now() - t0 });
		}
	}
	score(model, results);
}

function score(model: string, results: { case: string; positive: boolean; predicted: boolean; error?: string; relationMatches?: boolean }[]) {
	// how many AI-judged positives get the spec 08 relation (so a live run shows the same severities as offline)
	const relationMatches = results.filter((r) => r.relationMatches).length;
	const failed = results.filter((r) => r.error).length;
	const tp = results.filter((r) => r.positive && r.predicted).length;
	const fp = results.filter((r) => !r.positive && r.predicted).length;
	const fn = results.filter((r) => r.positive && !r.predicted).length;
	const highFound = !!results.find((r) => r.case.startsWith('P1'))?.predicted;
	const others = results.filter((r) => r.positive && !r.case.startsWith('P1') && r.predicted).length;
	const pass = failed <= 1 && highFound && others >= 4 && fp <= 2;
	const precision = tp + fp ? tp / (tp + fp) : 0;
	const recall = tp + fn ? tp / (tp + fn) : 0;
	if (!fromFiles) writeFileSync(`fixtures/eval/judge-${model}.json`, JSON.stringify({ model, date: new Date().toISOString(), pass, precision, recall, tp, fp, fn, failedCalls: failed, results }, null, '\t') + '\n');
	summary.push({ model, pass, precision: Math.round(precision * 100) / 100, recall: Math.round(recall * 100) / 100, fp, failedCalls: failed, relationMatches });
	console.log(`${model}: pass=${pass} precision=${precision.toFixed(2)} recall=${recall.toFixed(2)} fp=${fp} highPair=${highFound} otherPositives=${others}/5 failedCalls=${failed} spec08Relation=${relationMatches}/5`);
}
const best = summary.filter((s) => s.pass).sort((a, b) => a.fp - b.fp || b.recall - a.recall || b.relationMatches - a.relationMatches || b.precision - a.precision)[0];
writeFileSync('fixtures/eval/summary.json', JSON.stringify({ date: new Date().toISOString(), summary, recommendation: best ? { THAILLM_MODEL: best.model } : { AI_CAUTION_PROVIDER: 'gemini' } }, null, '\t') + '\n');
console.log(best ? `\nRecommendation: THAILLM_MODEL=${best.model}` : '\nNo model passed: set AI_CAUTION_PROVIDER=gemini');
