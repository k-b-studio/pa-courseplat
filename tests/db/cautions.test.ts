/**
 * Spec 06 AC 8 on the shared project, with the AI providers mocked: ThaiLLM unreachable → the
 * Gemini corpus fallback; both failing → Stage 1 results kept, the run marked failed. Works on
 * 2404429 (2/2569) and puts it back to "not started" afterwards.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aiConfigFrom } from '$lib/server/ai/config';
import { resetFormatMode } from '$lib/server/ai/providers/thaillm';
import { RateLimiter } from '$lib/server/ai/rate-limit';
import { runCautions } from '$lib/server/cautions/run';

const sql = postgres(process.env.SUPABASE_DB_URL!, { prepare: false, max: 1, onnotice: () => {} });
const admin = createClient<any, 'courseplat'>(process.env.PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false }, db: { schema: 'courseplat' } });
const cfg = { ...aiConfigFrom({ GEMINI_API_KEY: 'mock', THAILLM_API_KEY: 'mock', AI_CAUTION_PROVIDER: 'thaillm' }), offline: false };
const noWait = { now: () => Date.now(), sleep: async () => {} };
let id = '';

async function reset() {
	await sql.begin(async (tx) => {
		await tx`delete from courseplat.content_cautions where (a_offering_id = ${id} or b_offering_id = ${id}) and source <> 'seed'`;
		await tx`delete from courseplat.caution_runs where offering_id = ${id}`;
		await tx`delete from courseplat.syllabus_items where offering_id = ${id}`;
		await tx`update courseplat.offerings set syllabus = null, revision = 0, status = 'not_started', updated_at = null where id = ${id}`;
	});
}

beforeAll(async () => {
	[{ id }] = await sql<{ id: string }[]>`select id from courseplat.offerings where course_code = '2404429' and semester_id = '2569-2'`;
	await reset();
	const doc = JSON.parse(readFileSync('fixtures/extractions/2404429.json', 'utf-8')).doc;
	await sql`update courseplat.offerings set syllabus = ${doc as never}::jsonb, revision = 1, status = 'draft' where id = ${id}`;
});
afterAll(async () => {
	await reset();
	await sql.end();
});

const thaiDown = () => ({ create: async () => { throw Object.assign(new Error('connect ECONNREFUSED'), { status: 503 }); }, clock: noWait, limiter: new RateLimiter({ maxConcurrent: 3, perSecond: 1000 }) });
const geminiAnswers = {
	clock: noWait,
	generateContent: async (req: any) => {
		const corpus: string = req.contents[0].parts.map((p: any) => p.text ?? '').join('\n');
		const c = /<course id="(C\d+)" course="2404324"/.exec(corpus)![1];
		return { text: JSON.stringify({ pairs: [{ subjectRef: 'S#work:w-1', otherRef: `${c}#work:w-1`, kind: 'assignment', similarity: 0.9, relation: 'duplicate', reasonTH: 'policy brief ซ้ำกับ 2404324', suggestionTH: 'ปรับเป็น options memo' }] }), modelVersion: 'mock', candidates: [{ finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } };
	}
};
const geminiQuota = { clock: noWait, generateContent: async () => { throw Object.assign(new Error(JSON.stringify({ error: { code: 429, status: 'RESOURCE_EXHAUSTED', details: [] } })), { status: 429 }); } };

describe('spec 06 AC 8 — when the AI judge is unavailable', () => {
	it('ThaiLLM unreachable → the Gemini corpus comparison finds the policy-brief pair', async () => {
		resetFormatMode();
		const s = await runCautions(admin, { offeringId: id, userId: null, trigger: 'manual', cfg }, { ai: { thaillm: thaiDown(), gemini: geminiAnswers } });
		expect(s.aiFailed).toBe(false);
		const rows = await sql<{ kind: string; severity: string; source: string }[]>`select kind::text, severity::text, source from courseplat.content_cautions where (a_offering_id = ${id} or b_offering_id = ${id}) and status = 'open'`;
		expect(rows).toContainEqual({ kind: 'assignment', severity: 'high', source: 'ai' });
		expect(rows).toContainEqual({ kind: 'reading', severity: 'medium', source: 'rule' });
	});

	it('both failing → Stage 1 kept, earlier AI cautions left open, the run marked failed with the error', async () => {
		resetFormatMode();
		const s = await runCautions(admin, { offeringId: id, userId: null, trigger: 'manual', cfg }, { ai: { thaillm: thaiDown(), gemini: geminiQuota } });
		expect(s.aiFailed).toBe(true);
		const [run] = await sql<{ status: string; error: string | null }[]>`select status, error from courseplat.caution_runs where id = ${s.runId}`;
		expect(run.status).toBe('failed');
		expect(run.error).toBeTruthy();
		const rows = await sql<{ kind: string; source: string; status: string }[]>`select kind::text, source, status::text from courseplat.content_cautions where (a_offering_id = ${id} or b_offering_id = ${id})`;
		expect(rows).toContainEqual({ kind: 'reading', source: 'rule', status: 'open' });
		expect(rows).toContainEqual({ kind: 'assignment', source: 'ai', status: 'open' });
	});
});
