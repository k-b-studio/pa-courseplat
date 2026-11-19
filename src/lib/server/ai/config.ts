/**
 * AI configuration from an env map. SvelteKit passes $env/dynamic/private; scripts pass process.env.
 * Keys never leave the server (src/lib/server/** and scripts/** only).
 */
export type AiConfig = {
	offline: boolean;
	tier: 'free' | 'paid';
	maxCallsPerHour: number;
	gemini: { apiKey: string | undefined; model: string; fallbackModel: string };
	thaillm: { apiKey: string | undefined; baseURL: string; model: string };
	cautionProvider: 'thaillm' | 'gemini';
	extractFallback: 'thaillm' | 'none';
};

type Env = Record<string, string | undefined>;

export function aiConfigFrom(env: Env): AiConfig {
	return {
		offline: env.AI_OFFLINE === 'true',
		tier: env.AI_TIER === 'paid' ? 'paid' : 'free',
		maxCallsPerHour: Number(env.AI_MAX_CALLS_PER_HOUR || 6),
		gemini: {
			apiKey: env.GEMINI_API_KEY || undefined,
			model: env.AI_MODEL || 'gemini-3.6-flash', // the alias gemini-flash-latest answers 404 (recorded 2026-11-19)
			fallbackModel: env.AI_FALLBACK_MODEL || 'gemini-3.5-flash-lite'
		},
		thaillm: {
			apiKey: env.THAILLM_API_KEY || undefined,
			baseURL: env.THAILLM_BASE_URL || 'https://thaillm.or.th/api/v1',
			model: env.THAILLM_MODEL || 'typhoon'
		},
		cautionProvider: env.AI_CAUTION_PROVIDER === 'gemini' ? 'gemini' : 'thaillm',
		extractFallback: env.AI_EXTRACT_FALLBACK === 'none' ? 'none' : 'thaillm'
	};
}
