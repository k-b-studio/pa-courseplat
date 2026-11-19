/** Offline judgements for caution runs (spec 06 "Offline and seeded data"), bundled at build time. */
import type { CautionFixture } from './run';

const files = import.meta.glob('../../../../fixtures/cautions/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

export function cautionFixture(code: string, semester: string): CautionFixture | null {
	const key = Object.keys(files).find((k) => k.endsWith(`/${code}-${semester}.json`));
	return key ? (files[key] as CautionFixture) : null;
}
