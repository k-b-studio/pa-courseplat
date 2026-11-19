/** Shared e2e helpers: fail on console errors (spec 08), demo sign-in, and read-only DB lookups. */
import { test as base, expect, type Page } from '@playwright/test';
import postgres from 'postgres';

type Fixtures = {
	/** Runs for every test and fails it on any console error; call it to allow an expected message. */
	allowConsole: (pattern: RegExp) => void;
};

export const test = base.extend<Fixtures>({
	allowConsole: [
		async ({ page }, use) => {
			const errors: string[] = [];
			const allowed: RegExp[] = [];
			page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
			page.on('pageerror', (e) => errors.push(e.message));
			await use((p) => allowed.push(p));
			expect(errors.filter((e) => !allowed.some((a) => a.test(e))), 'console errors').toEqual([]);
		},
		{ auto: true }
	]
});
export { expect };

export type DemoKey = 'student' | 'prof-natthida' | 'prof-thanakrit' | 'staff';

export async function signInDemo(page: Page, key: DemoKey) {
	await page.goto('/');
	await page.locator(`button[data-demo="${key}"]`).click();
	await page.waitForURL((u) => u.pathname !== '/' && !u.pathname.startsWith('/auth'));
}

let sql: ReturnType<typeof postgres> | null = null;
export function db() {
	if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL missing (.env)');
	sql ??= postgres(process.env.SUPABASE_DB_URL, { prepare: false, max: 1, onnotice: () => {} });
	return sql;
}

export async function offeringIds(semesterId = '2569-2'): Promise<Map<string, string>> {
	const rows = await db()<{ id: string; course_code: string }[]>`select id, course_code from courseplat.offerings where semester_id = ${semesterId}`;
	return new Map(rows.map((r) => [r.course_code, r.id]));
}

/**
 * Put a seeded offering back to "not started" (what demo:reset does for the live-demo course).
 * Only ever used on 2404429 in 2/2569, which the seed leaves not started.
 */
export async function resetNotStarted(code = '2404429', semester = '2569-2') {
	await db().begin(async (tx) => {
		const [o] = await tx<{ id: string }[]>`select id from courseplat.offerings where course_code = ${code} and semester_id = ${semester}`;
		await tx`delete from courseplat.offering_versions where offering_id = ${o.id}`;
		await tx`delete from courseplat.syllabus_items where offering_id = ${o.id}`;
		await tx`delete from courseplat.extractions where offering_id = ${o.id}`;
		await tx`update courseplat.offerings set syllabus = null, revision = 0, status = 'not_started', cloned_from = null, updated_by = null, updated_at = null, published_at = null, published_revision = null where id = ${o.id}`;
	});
}
