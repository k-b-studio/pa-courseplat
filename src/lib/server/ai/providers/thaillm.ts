/**
 * ThaiLLM (NSTDA): OpenAI-compatible chat completions over HTTPS (spec 02).
 * response_format: json_schema → (HTTP 400) json_object → plain instructions.
 * Replies: drop <think>, take the first balanced JSON object, validate with Zod, one repair retry.
 * At most 3 requests in flight and 4 starts per second; back off 1 s, 2 s, 4 s on 429 / 5xx.
 */
import OpenAI from 'openai';
import { z } from 'zod';
import { toGeminiSchema } from '../gemini-schema';
import { parseJsonReply } from '../json-reply';
import { RateLimiter, realClock, type Clock } from '../rate-limit';
import { AiError, type AiCallLog, type GenerateOpts, type GenerateResult } from '../types';

export type FormatMode = 'json_schema' | 'json_object' | 'none';

export type ChatBody = {
	model: string;
	messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
	max_tokens: number;
	temperature: number;
	response_format?: { type: 'json_schema'; json_schema: { name: string; schema: unknown; strict: boolean } } | { type: 'json_object' };
};

export type ChatReply = {
	content: string;
	model?: string;
	usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export type ThaiLlmDeps = {
	create: (body: ChatBody) => Promise<ChatReply>;
	clock?: Clock;
	limiter?: RateLimiter;
};

export function thaiLlmDeps(apiKey: string, baseURL: string): ThaiLlmDeps {
	if (!baseURL.startsWith('https://')) {
		throw new AiError('config', 'THAILLM_BASE_URL must use HTTPS');
	}
	const client = new OpenAI({ apiKey, baseURL, maxRetries: 0, timeout: 90_000 });
	return {
		create: async (body) => {
			const r = await client.chat.completions.create(body as never);
			const msg = (r as OpenAI.Chat.Completions.ChatCompletion).choices?.[0]?.message;
			return { content: msg?.content ?? '', model: r.model, usage: r.usage ?? undefined };
		}
	};
}

/** Shared limiter for the whole process: 3 in flight, 4 starts per second. */
export const thaiLlmLimiter = new RateLimiter({ maxConcurrent: 3, perSecond: 4 });

/** Remember which response_format the server accepted, so later calls skip the 400s. */
let workingMode: FormatMode = 'json_schema';
export function resetFormatMode() {
	workingMode = 'json_schema';
}
const ORDER: FormatMode[] = ['json_schema', 'json_object', 'none'];

function statusOf(e: unknown): number | null {
	if (e && typeof e === 'object' && 'status' in e && typeof (e as { status: unknown }).status === 'number') {
		return (e as { status: number }).status;
	}
	return null;
}

const BACKOFF_MS = [1000, 2000, 4000];

export async function thaiLlmGenerate<T>(opts: GenerateOpts<T> & { model: string }, deps: ThaiLlmDeps): Promise<GenerateResult<T>> {
	const clock = deps.clock ?? realClock;
	const limiter = deps.limiter ?? thaiLlmLimiter;
	const jsonSchema = toGeminiSchema(z.toJSONSchema(opts.schema as z.ZodType));
	const name = opts.schemaName ?? opts.kind;
	const notes: string[] = [];

	for (const p of opts.parts) {
		if ('inlineData' in p) throw new AiError('config', 'ThaiLLM is text-only');
	}
	const userText = opts.parts.map((p) => ('text' in p ? p.text : '')).join('\n\n');
	const schemaHint = `\n\nReply with one JSON object only, no other text, matching this JSON Schema:\n${JSON.stringify(jsonSchema)}`;

	const log = async (row: Omit<AiCallLog, 'provider' | 'kind'>) => {
		await opts.onCall?.({ provider: 'thaillm', kind: opts.kind, ...row });
	};

	const bodyFor = (mode: FormatMode, extra: { role: 'assistant' | 'user'; content: string }[]): ChatBody => ({
		model: opts.model,
		messages: [
			{ role: 'system', content: opts.system + (mode === 'json_schema' ? '' : schemaHint) },
			{ role: 'user', content: userText },
			...extra
		],
		max_tokens: opts.maxOutputTokens,
		temperature: 0.2,
		...(mode === 'json_schema'
			? { response_format: { type: 'json_schema' as const, json_schema: { name, schema: jsonSchema, strict: true } } }
			: mode === 'json_object'
				? { response_format: { type: 'json_object' as const } }
				: {})
	});

	/** One logical request: format fallback on 400, backoff on 429 / 5xx / network. */
	const request = async (extra: { role: 'assistant' | 'user'; content: string }[]): Promise<ChatReply> => {
		let modeIdx = ORDER.indexOf(workingMode);
		let attempt = 0;
		for (;;) {
			const mode = ORDER[modeIdx];
			const started = clock.now();
			try {
				const reply = await limiter.run(() => deps.create(bodyFor(mode, extra)));
				await log({
					model: opts.model,
					modelVersion: reply.model ?? opts.model,
					status: 'ok',
					httpStatus: 200,
					inputTokens: reply.usage?.prompt_tokens ?? null,
					outputTokens: reply.usage?.completion_tokens ?? null,
					latencyMs: clock.now() - started
				});
				workingMode = mode;
				return reply;
			} catch (e) {
				const status = statusOf(e);
				const latencyMs = clock.now() - started;
				await log({
					model: opts.model,
					modelVersion: null,
					status: status === 429 ? 'rate_limited' : 'error',
					httpStatus: status,
					inputTokens: null,
					outputTokens: null,
					latencyMs
				});
				if (status === 400 && modeIdx < ORDER.length - 1) {
					modeIdx++;
					notes.push(`response_format fallback → ${ORDER[modeIdx]}`);
					continue;
				}
				const retriable = status === null || status === 429 || status >= 500;
				if (retriable && attempt < BACKOFF_MS.length) {
					await clock.sleep(BACKOFF_MS[attempt]);
					attempt++;
					continue;
				}
				if (status === 429) throw new AiError('quota', 'ThaiLLM rate limit', 429);
				throw new AiError('unavailable', `ThaiLLM request failed${status ? ` (HTTP ${status})` : ''}`, status);
			}
		}
	};

	let inTok = 0;
	let outTok = 0;
	const first = await request([]);
	inTok += first.usage?.prompt_tokens ?? 0;
	outTok += first.usage?.completion_tokens ?? 0;

	const validate = (content: string) => {
		try {
			const value = parseJsonReply(content);
			const r = opts.schema.safeParse(value);
			return r.success
				? ({ ok: true, data: r.data } as const)
				: ({ ok: false, errors: r.error.issues.slice(0, 20).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n') } as const);
		} catch {
			return { ok: false, errors: 'The reply did not contain a JSON object.' } as const;
		}
	};

	let v = validate(first.content);
	let last = first;
	if (!v.ok) {
		notes.push('repair retry');
		const repair = await request([
			{ role: 'assistant', content: first.content.slice(0, 6000) },
			{ role: 'user', content: `That JSON did not validate. Errors:\n${v.errors}\nReturn the complete corrected JSON object only.` }
		]);
		inTok += repair.usage?.prompt_tokens ?? 0;
		outTok += repair.usage?.completion_tokens ?? 0;
		v = validate(repair.content);
		last = repair;
		if (!v.ok) throw new AiError('invalid', 'ThaiLLM output failed validation after the repair retry');
	}

	return {
		data: v.data as T,
		model: opts.model,
		modelVersion: last.model ?? opts.model,
		usage: { input: inTok, output: outTok },
		notes
	};
}
