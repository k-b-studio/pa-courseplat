import type { ZodType } from 'zod';

export type Provider = 'gemini' | 'thaillm';
export type AiKind = 'extract' | 'compare' | 'judge';

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export type AiCallStatus = 'ok' | 'rate_limited' | 'error' | 'offline';

/** One row of courseplat.ai_calls (spec 02). */
export type AiCallLog = {
	provider: Provider;
	kind: AiKind;
	model: string;
	modelVersion: string | null;
	status: AiCallStatus;
	httpStatus: number | null;
	inputTokens: number | null;
	outputTokens: number | null;
	latencyMs: number;
};

export type OnCall = (row: AiCallLog) => void | Promise<void>;

export type GenerateOpts<T> = {
	provider: Provider;
	kind: AiKind;
	system: string;
	parts: Part[];
	schema: ZodType<T>;
	/** JSON schema name for ThaiLLM's response_format */
	schemaName?: string;
	maxOutputTokens: number;
	/** override the configured model */
	model?: string;
	onCall?: OnCall;
};

export type GenerateResult<T> = {
	data: T;
	model: string;
	modelVersion: string;
	usage: { input: number; output: number };
	/** set when the response needed a repair retry or other notes */
	notes: string[];
};

export type AiErrorCode =
	| 'quota' // free-tier quota or rate limit after the fallback model
	| 'max_tokens' // output cut off: document too long
	| 'blocked' // safety / recitation
	| 'empty' // no text in the response
	| 'invalid' // output failed schema validation after the repair retry
	| 'unavailable' // network / 5xx after retries
	| 'config'; // missing key or model

export class AiError extends Error {
	constructor(
		readonly code: AiErrorCode,
		message: string,
		readonly httpStatus: number | null = null
	) {
		super(message);
		this.name = 'AiError';
	}
}
