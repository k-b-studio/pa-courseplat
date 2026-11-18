import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ExtractionResult } from '../../src/lib/schema/extraction';
import { toGeminiSchema, SchemaSubsetError } from '../../src/lib/server/ai/gemini-schema';
import { redactContacts } from '../../src/lib/server/ai/redact';
import { parseJsonReply } from '../../src/lib/server/ai/json-reply';
import { RateLimiter, realClock } from '../../src/lib/server/ai/rate-limit';
import { thaiLlmGenerate, resetFormatMode, type ChatBody } from '../../src/lib/server/ai/providers/thaillm';
import { geminiGenerate, retryDelaySeconds } from '../../src/lib/server/ai/providers/gemini';
import { AiError, type AiCallLog } from '../../src/lib/server/ai/types';

function walk(node: unknown, visit: (n: Record<string, unknown>) => void) {
	if (Array.isArray(node)) node.forEach((n) => walk(n, visit));
	else if (node && typeof node === 'object') {
		visit(node as Record<string, unknown>);
		Object.values(node).forEach((v) => walk(v, visit));
	}
}

describe('toGeminiSchema (spec 02 AC 7)', () => {
	const raw = z.toJSONSchema(ExtractionResult);
	const g = toGeminiSchema(raw);
	const text = JSON.stringify(g);

	it('contains none of the unsupported keywords', () => {
		for (const k of ['$ref', 'anyOf', 'oneOf', 'minLength', 'maxLength', 'pattern', '$schema', '"default"']) {
			expect(text.includes(k), k).toBe(false);
		}
	});

	it('keeps every enum', () => {
		const count = (s: string) => (s.match(/"enum"/g) ?? []).length;
		expect(count(text)).toBeGreaterThan(0);
		expect(count(text)).toBe(count(JSON.stringify(raw)) + (JSON.stringify(raw).match(/"const"/g) ?? []).length);
	});

	it('uses ["…","null"] type arrays for nullable fields', () => {
		const year = (g as any).properties.doc.properties.resources.properties.readings.items.properties.year;
		expect(year.type).toEqual(['integer', 'null']);
		const url = (g as any).properties.doc.properties.resources.properties.readings.items.properties.url;
		expect(url.type).toEqual(['string', 'null']);
	});

	it('sets additionalProperties:false and required on every object', () => {
		walk(g, (n) => {
			const types = Array.isArray(n.type) ? n.type : [n.type];
			if (types.includes('object') && n.properties) {
				expect(n.additionalProperties).toBe(false);
				expect(n.required).toEqual(Object.keys(n.properties as object));
			}
		});
	});

	it('fails loudly on $ref, real unions and oneOf', () => {
		expect(() => toGeminiSchema({ $ref: '#/x' })).toThrow(SchemaSubsetError);
		expect(() => toGeminiSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] })).toThrow(SchemaSubsetError);
		expect(() => toGeminiSchema({ oneOf: [{ type: 'string' }] })).toThrow(SchemaSubsetError);
	});
});

describe('redactContacts (spec 02 AC 7)', () => {
	it('removes phone and e-mail', () => {
		const out = redactContacts('โทร 081-234-5678 อีเมล a.b@chula.ac.th');
		expect(out).not.toContain('081-234-5678');
		expect(out).not.toContain('a.b@chula.ac.th');
		expect(out).toContain('[อีเมล]');
		expect(out).toContain('[เบอร์โทรศัพท์]');
	});
	it('handles other phone shapes and leaves ISBNs, years and weeks alone', () => {
		expect(redactContacts('02 218 7200 ต่อ 12')).toBe('[เบอร์โทรศัพท์]');
		expect(redactContacts('+66 81 234 5678')).toBe('[เบอร์โทรศัพท์]');
		expect(redactContacts('0812345678')).toBe('[เบอร์โทรศัพท์]');
		expect(redactContacts('ISBN 9780134169972 (2017) สัปดาห์ที่ 12')).toBe('ISBN 9780134169972 (2017) สัปดาห์ที่ 12');
		expect(redactContacts('รหัสวิชา 2404324')).toBe('รหัสวิชา 2404324');
	});
});

describe('ThaiLLM reply parsing (spec 02 AC 8)', () => {
	const expected = { overlap: true, similarity: 0.8, relation: 'duplicate', reasonTH: 'ตัวแบบกระบวนการนโยบาย {ซ้ำ}', suggestionTH: '' };
	const json = JSON.stringify(expected);
	it('think block, code fence and trailing text all parse to the same object', () => {
		expect(parseJsonReply(`<think>\nfirst I consider {"a":1}...\n</think>\n${json}`)).toEqual(expected);
		expect(parseJsonReply('ผลลัพธ์:\n```json\n' + json + '\n```')).toEqual(expected);
		expect(parseJsonReply(`${json}\n\nหวังว่าจะเป็นประโยชน์ {ไม่ใช่ JSON}`)).toEqual(expected);
	});
	it('throws when there is no JSON', () => {
		expect(() => parseJsonReply('<think>still thinking')).toThrow();
	});
});

describe('ThaiLLM client', () => {
	const schema = z.object({ answer: z.string() });
	const noWait = { now: () => Date.now(), sleep: async () => {} };
	beforeEach(() => resetFormatMode());

	it('a 400 on json_schema retries with json_object', async () => {
		const bodies: ChatBody[] = [];
		const logs: AiCallLog[] = [];
		const create = async (body: ChatBody) => {
			bodies.push(body);
			if (body.response_format?.type === 'json_schema') throw Object.assign(new Error('bad request'), { status: 400 });
			return { content: '{"answer":"ok"}', usage: { prompt_tokens: 10, completion_tokens: 3 } };
		};
		const r = await thaiLlmGenerate(
			{ provider: 'thaillm', kind: 'judge', system: 's', parts: [{ text: 'x' }], schema, maxOutputTokens: 100, model: 'typhoon', onCall: (l) => void logs.push(l) },
			{ create, clock: noWait, limiter: new RateLimiter({ maxConcurrent: 3, perSecond: 4 }) }
		);
		expect(r.data).toEqual({ answer: 'ok' });
		expect(bodies.map((b) => b.response_format?.type ?? 'none')).toEqual(['json_schema', 'json_object']);
		expect(logs.map((l) => l.status)).toEqual(['error', 'ok']);
	});

	it('falls back to plain instructions after json_object also fails', async () => {
		const types: string[] = [];
		const create = async (body: ChatBody) => {
			types.push(body.response_format?.type ?? 'none');
			if (body.response_format) throw Object.assign(new Error('bad'), { status: 400 });
			return { content: '<think>hmm</think>{"answer":"plain"}' };
		};
		const r = await thaiLlmGenerate(
			{ provider: 'thaillm', kind: 'judge', system: 's', parts: [{ text: 'x' }], schema, maxOutputTokens: 100, model: 'pathumma' },
			{ create, clock: noWait, limiter: new RateLimiter({ maxConcurrent: 3, perSecond: 4 }) }
		);
		expect(r.data.answer).toBe('plain');
		expect(types).toEqual(['json_schema', 'json_object', 'none']);
	});

	it('repairs once with the validation errors', async () => {
		let n = 0;
		const create = async (body: ChatBody) => {
			n++;
			return { content: n === 1 ? '{"answer": 5}' : '{"answer":"fixed"}' };
		};
		const r = await thaiLlmGenerate(
			{ provider: 'thaillm', kind: 'judge', system: 's', parts: [{ text: 'x' }], schema, maxOutputTokens: 100, model: 'typhoon' },
			{ create, clock: noWait, limiter: new RateLimiter({ maxConcurrent: 3, perSecond: 4 }) }
		);
		expect(r.data.answer).toBe('fixed');
		expect(r.notes).toContain('repair retry');
	});

	it('refuses a non-HTTPS base URL', async () => {
		const { thaiLlmDeps } = await import('../../src/lib/server/ai/providers/thaillm');
		expect(() => thaiLlmDeps('k', 'http://thaillm.or.th/api/v1')).toThrow(AiError);
	});
});

describe('rate limiter (spec 02 AC 8)', () => {
	beforeEach(() => vi.useFakeTimers({ now: 0 }));
	afterEach(() => vi.useRealTimers());

	it('never starts more than 4 requests in any one second, nor more than 3 at once', async () => {
		const limiter = new RateLimiter({ maxConcurrent: 3, perSecond: 4 }, realClock);
		const starts: number[] = [];
		let inFlight = 0;
		let maxInFlight = 0;
		const tasks = Array.from({ length: 20 }, (_, i) =>
			limiter.run(async () => {
				starts.push(Date.now());
				inFlight++;
				maxInFlight = Math.max(maxInFlight, inFlight);
				await new Promise((r) => setTimeout(r, i % 3 === 0 ? 50 : 300));
				inFlight--;
			})
		);
		await vi.advanceTimersByTimeAsync(20_000);
		await Promise.all(tasks);
		expect(starts).toHaveLength(20);
		for (const t of starts) {
			expect(starts.filter((s) => s >= t && s < t + 1000).length).toBeLessThanOrEqual(4);
		}
		expect(maxInFlight).toBeLessThanOrEqual(3);
	});
});

describe('Gemini free-tier 429 policy', () => {
	const schema = z.object({ answer: z.string() });
	const noWait = { now: () => 0, sleep: async () => {} };
	const err429 = (delay?: string) =>
		Object.assign(
			new Error(JSON.stringify({ error: { code: 429, status: 'RESOURCE_EXHAUSTED', details: delay ? [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: delay }] : [] } })),
			{ status: 429 }
		);

	it('reads retryDelay', () => {
		expect(retryDelaySeconds(err429('17s'))).toBe(17);
		expect(retryDelaySeconds(err429())).toBeNull();
	});

	it('429 on both models → quota error and two rate_limited rows', async () => {
		const logs: AiCallLog[] = [];
		const models: string[] = [];
		await expect(
			geminiGenerate(
				{ provider: 'gemini', kind: 'extract', system: 's', parts: [{ text: 'x' }], schema, maxOutputTokens: 100, model: 'm1', fallbackModel: 'm2', onCall: (l) => void logs.push(l) },
				{ generateContent: async (req) => { models.push(req.model); throw err429('45s'); }, clock: noWait }
			)
		).rejects.toMatchObject({ code: 'quota' });
		expect(models).toEqual(['m1', 'm2']);
		expect(logs.filter((l) => l.status === 'rate_limited')).toHaveLength(2);
	});

	it('a short retry delay waits once on the same model', async () => {
		const models: string[] = [];
		let n = 0;
		const r = await geminiGenerate(
			{ provider: 'gemini', kind: 'extract', system: 's', parts: [{ text: 'x' }], schema, maxOutputTokens: 100, model: 'm1', fallbackModel: 'm2' },
			{
				generateContent: async (req) => {
					models.push(req.model);
					if (n++ === 0) throw err429('5s');
					return { text: '{"answer":"ok"}', modelVersion: 'm1-001', candidates: [{ finishReason: 'STOP' }] };
				},
				clock: noWait
			}
		);
		expect(models).toEqual(['m1', 'm1']);
		expect(r.modelVersion).toBe('m1-001');
	});

	it('MAX_TOKENS fails with max_tokens', async () => {
		await expect(
			geminiGenerate(
				{ provider: 'gemini', kind: 'extract', system: 's', parts: [{ text: 'x' }], schema, maxOutputTokens: 100, model: 'm1', fallbackModel: 'm2' },
				{ generateContent: async () => ({ text: '{"ans', candidates: [{ finishReason: 'MAX_TOKENS' }] }), clock: noWait }
			)
		).rejects.toMatchObject({ code: 'max_tokens' });
	});
});
