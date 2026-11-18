/**
 * Google Gemini API (free tier) through @google/genai generateContent (spec 02).
 * Free-tier 429 policy: wait once if the retry delay is ≤ 20 s, otherwise (or if it fails again)
 * retry once with the fallback model, otherwise fail with code 'quota'.
 * 5xx: retry twice with backoff 1 s, 4 s. Output validated with Zod, one repair retry.
 */
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { toGeminiSchema } from '../gemini-schema';
import { AiError, type AiCallLog, type GenerateOpts, type GenerateResult, type Part } from '../types';
import { realClock, type Clock } from '../rate-limit';

export type GeminiRequest = {
	model: string;
	contents: { role: 'user' | 'model'; parts: Part[] }[];
	config: {
		systemInstruction: string;
		responseMimeType: 'application/json';
		responseJsonSchema: unknown;
		maxOutputTokens: number;
		temperature: number;
	};
};

export type GeminiResponseLike = {
	text?: string;
	modelVersion?: string;
	candidates?: { finishReason?: string }[];
	usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number };
	promptFeedback?: { blockReason?: string };
};

export type GeminiDeps = {
	generateContent: (req: GeminiRequest) => Promise<GeminiResponseLike>;
	clock?: Clock;
};

export function geminiDeps(apiKey: string): GeminiDeps {
	const ai = new GoogleGenAI({ apiKey });
	return {
		generateContent: (req) => ai.models.generateContent(req as never) as Promise<GeminiResponseLike>
	};
}

const MAX_SHORT_WAIT_S = 20;

/** HTTP status from an @google/genai ApiError (or anything with .status). */
export function errorStatus(e: unknown): number | null {
	if (e && typeof e === 'object' && 'status' in e && typeof (e as { status: unknown }).status === 'number') {
		return (e as { status: number }).status;
	}
	return null;
}

/** retryDelay from a 429 body (google.rpc.RetryInfo), in seconds. */
export function retryDelaySeconds(e: unknown): number | null {
	const msg = e instanceof Error ? e.message : String(e);
	const m = msg.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/) ?? msg.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
	return m ? Number(m[1]) : null;
}

const BLOCKED = new Set(['SAFETY', 'RECITATION', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'IMAGE_SAFETY']);

export async function geminiGenerate<T>(
	opts: GenerateOpts<T> & { fallbackModel: string; model: string },
	deps: GeminiDeps
): Promise<GenerateResult<T>> {
	const clock = deps.clock ?? realClock;
	const responseJsonSchema = toGeminiSchema(z.toJSONSchema(opts.schema as z.ZodType));
	const notes: string[] = [];

	const log = async (row: Omit<AiCallLog, 'provider' | 'kind'>) => {
		await opts.onCall?.({ provider: 'gemini', kind: opts.kind, ...row });
	};

	/** One HTTP call with the 429 / 5xx policy. */
	const call = async (parts: Part[]): Promise<{ res: GeminiResponseLike; model: string }> => {
		let model = opts.model;
		let waitedShort = false;
		let usedFallback = false;
		let serverRetries = 0;
		for (;;) {
			const started = clock.now();
			try {
				const res = await deps.generateContent({
					model,
					contents: [{ role: 'user', parts }],
					config: {
						systemInstruction: opts.system,
						responseMimeType: 'application/json',
						responseJsonSchema,
						maxOutputTokens: opts.maxOutputTokens,
						temperature: 0.2
					}
				});
				const u = res.usageMetadata;
				await log({
					model,
					modelVersion: res.modelVersion ?? null,
					status: 'ok',
					httpStatus: 200,
					inputTokens: u?.promptTokenCount ?? null,
					outputTokens: (u?.candidatesTokenCount ?? 0) + (u?.thoughtsTokenCount ?? 0) || null,
					latencyMs: clock.now() - started
				});
				return { res, model };
			} catch (e) {
				const status = errorStatus(e);
				const latencyMs = clock.now() - started;
				if (status === 429) {
					await log({ model, modelVersion: null, status: 'rate_limited', httpStatus: 429, inputTokens: null, outputTokens: null, latencyMs });
					const delay = retryDelaySeconds(e);
					if (!waitedShort && !usedFallback && delay !== null && delay <= MAX_SHORT_WAIT_S) {
						waitedShort = true;
						await clock.sleep(Math.ceil(delay * 1000));
						continue;
					}
					if (!usedFallback && opts.fallbackModel && opts.fallbackModel !== model) {
						usedFallback = true;
						model = opts.fallbackModel;
						notes.push(`fallback model ${model}`);
						continue;
					}
					throw new AiError('quota', 'Gemini free-tier quota exhausted', 429);
				}
				await log({ model, modelVersion: null, status: 'error', httpStatus: status, inputTokens: null, outputTokens: null, latencyMs });
				if (status !== null && status >= 500 && serverRetries < 2) {
					await clock.sleep(serverRetries === 0 ? 1000 : 4000);
					serverRetries++;
					continue;
				}
				if (status !== null && status >= 500) throw new AiError('unavailable', `Gemini HTTP ${status}`, status);
				if (status === null) throw new AiError('unavailable', e instanceof Error ? e.message : 'Gemini request failed');
				throw new AiError('unavailable', `Gemini HTTP ${status}: ${e instanceof Error ? e.message.slice(0, 300) : ''}`, status);
			}
		}
	};

	const read = (res: GeminiResponseLike): string => {
		const finish = res.candidates?.[0]?.finishReason;
		if (finish === 'MAX_TOKENS') throw new AiError('max_tokens', 'output truncated (MAX_TOKENS)');
		if ((finish && BLOCKED.has(finish)) || res.promptFeedback?.blockReason) {
			throw new AiError('blocked', `blocked: ${finish ?? res.promptFeedback?.blockReason}`);
		}
		const text = res.text;
		if (!text || !text.trim()) throw new AiError('empty', 'empty response');
		return text;
	};

	let usageIn = 0;
	let usageOut = 0;
	const tally = (res: GeminiResponseLike) => {
		usageIn += res.usageMetadata?.promptTokenCount ?? 0;
		usageOut += (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0);
	};

	const first = await call(opts.parts);
	tally(first.res);
	let text = read(first.res);
	let parsed = safeJson(text);
	let result = parsed.ok ? opts.schema.safeParse(parsed.value) : null;
	let final = first;

	if (!result?.success) {
		// one repair retry that quotes the validation errors
		const errors = parsed.ok
			? (result?.error?.issues ?? []).slice(0, 20).map((i) => `${i.path.join('.')}: ${i.message}`).join('\n')
			: 'The reply was not valid JSON.';
		notes.push('repair retry');
		const repair = await call([
			...opts.parts,
			{ text: `Your previous JSON did not validate against the schema. Errors:\n${errors}\nReturn the complete corrected JSON object only.` }
		]);
		tally(repair.res);
		text = read(repair.res);
		parsed = safeJson(text);
		result = parsed.ok ? opts.schema.safeParse(parsed.value) : null;
		final = repair;
		if (!result?.success) throw new AiError('invalid', 'Gemini output failed validation after the repair retry');
	}

	return {
		data: result.data as T,
		model: final.model,
		modelVersion: final.res.modelVersion ?? final.model,
		usage: { input: usageIn, output: usageOut },
		notes
	};
}

function safeJson(text: string): { ok: true; value: unknown } | { ok: false } {
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false };
	}
}
