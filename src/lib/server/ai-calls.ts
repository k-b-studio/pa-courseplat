/** ai_calls logging and the per-user hourly cap (spec 02 "Free-tier limits"). */
import type { AiCallLog, OnCall } from './ai/types';
import { adminClient } from './supabase-admin';

export function logCalls(userId: string): OnCall {
	return async (row: AiCallLog) => {
		await adminClient()
			.from('ai_calls')
			.insert({ provider: row.provider, kind: row.kind, model: row.model, model_version: row.modelVersion ?? null, status: row.status, http_status: row.httpStatus ?? null, input_tokens: row.inputTokens ?? null, output_tokens: row.outputTokens ?? null, latency_ms: row.latencyMs ?? null, created_by: userId });
	};
}

/** Calls in the last hour that reached a provider (offline fixtures don't count). */
export async function callsLastHour(userId: string): Promise<number> {
	const since = new Date(Date.now() - 3_600_000).toISOString();
	const { count } = await adminClient().from('ai_calls').select('id', { count: 'exact', head: true }).eq('created_by', userId).neq('status', 'offline').gte('created_at', since);
	return count ?? 0;
}
