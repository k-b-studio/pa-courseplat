/**
 * generateJson(): the one interface every AI feature goes through (spec 02, decision D8).
 * Routing by provider, contact redaction of every text part, and ai_calls logging via onCall.
 * Changing a provider (or moving Gemini to the paid tier) touches one file.
 */
import type { AiConfig } from './config';
import { geminiDeps, geminiGenerate, type GeminiDeps } from './providers/gemini';
import { thaiLlmDeps, thaiLlmGenerate, type ThaiLlmDeps } from './providers/thaillm';
import { redactContacts } from './redact';
import { AiError, type GenerateOpts, type GenerateResult, type Part } from './types';

export type ProviderDeps = { gemini?: GeminiDeps; thaillm?: ThaiLlmDeps };

export function redactParts(parts: Part[]): Part[] {
	return parts.map((p) => ('text' in p ? { text: redactContacts(p.text) } : p));
}

export async function generateJson<T>(cfg: AiConfig, opts: GenerateOpts<T>, deps: ProviderDeps = {}): Promise<GenerateResult<T>> {
	if (cfg.offline) throw new AiError('config', 'AI_OFFLINE=true: no network calls');
	const parts = redactParts(opts.parts);
	if (opts.provider === 'gemini') {
		const d = deps.gemini ?? (cfg.gemini.apiKey ? geminiDeps(cfg.gemini.apiKey) : null);
		if (!d) throw new AiError('config', 'GEMINI_API_KEY is not set');
		return geminiGenerate(
			{ ...opts, parts, model: opts.model ?? cfg.gemini.model, fallbackModel: cfg.gemini.fallbackModel },
			d
		);
	}
	const d = deps.thaillm ?? (cfg.thaillm.apiKey ? thaiLlmDeps(cfg.thaillm.apiKey, cfg.thaillm.baseURL) : null);
	if (!d) throw new AiError('config', 'THAILLM_API_KEY is not set');
	return thaiLlmGenerate({ ...opts, parts, model: opts.model ?? cfg.thaillm.model }, d);
}
