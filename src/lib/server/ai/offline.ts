/**
 * AI_OFFLINE=true (spec 05 "Offline mode"): the sample files map to recorded results by sha256.
 * Fixtures are bundled at build time (import.meta.glob), so offline mode needs no file system
 * access on Vercel.
 */
import { createHash } from 'node:crypto';
import index from '../../../../fixtures/samples/index.json';
import { ExtractionResult } from '$lib/schema/extraction';

const fixtures = import.meta.glob('../../../../fixtures/extractions/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export const sha256 = (b: Uint8Array | string) => createHash('sha256').update(b).digest('hex');
export const normText = (s: string) => s.normalize('NFC').replace(/\s+/g, ' ').trim();
export const OFFLINE_DELAY_MS = 2500;

function load(path: string | undefined): ExtractionResult | null {
	if (!path) return null;
	const key = Object.keys(fixtures).find((k) => k.endsWith(path.replace(/^fixtures\/extractions\//, '/')));
	return key ? ExtractionResult.parse(fixtures[key]) : null;
}

export function offlineForFile(bytes: Uint8Array): ExtractionResult | null {
	return load((index.files as Record<string, string>)[sha256(bytes)]);
}

export function offlineForText(text: string): ExtractionResult | null {
	return load((index.byText as Record<string, string>)[sha256(normText(text))] ?? (index.files as Record<string, string>)[sha256(text)]);
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
