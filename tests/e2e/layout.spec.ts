/**
 * Regression: the editor sidebar (and every other place caution text appears) must never widen the page
 * (fix: sidebar overflow when caution tab is open). A worst-case caution on 2404324 carries a long Thai sentence
 * with no spaces plus a long URL; at every width the page must not scroll sideways, the publish button and every
 * sidebar tab must sit inside the viewport, and the drawer must not overflow its own box.
 */
import type { Page } from '@playwright/test';
import { db, expect, offeringIds, signInDemo, test } from './fixtures';

const WIDTHS = [390, 1024, 1140, 1280, 1440];
const PAIR_KEY = 'test|layout-overflow';
const LONG_THAI = 'การวิเคราะห์นโยบายสาธารณะเชิงเปรียบเทียบระหว่างหน่วยงานภาครัฐส่วนกลางและส่วนท้องถิ่นภายใต้กรอบธรรมาภิบาลและความรับผิดชอบต่อสาธารณะ'.slice(0, 120);
const LONG_URL = 'https://example.org/syllabus/archive/2569/semester-2/public-policy-analysis/readings/x';
let ids = new Map<string, string>();

test.beforeAll(async () => {
	ids = await offeringIds('2569-2');
	await db()`
		insert into courseplat.content_cautions (pair_key, semester_id, a_offering_id, a_ref, a_label, b_offering_id, b_ref, b_label, kind, relation, severity, similarity, reason_th, suggestion_th, source, a_hash, b_hash)
		values (${PAIR_KEY}, '2569-2', ${ids.get('2404324')!}, 'weeklyPlan:9', ${'2404324 สัปดาห์ 9: ' + LONG_THAI.slice(0, 60)}, ${ids.get('2404318')!}, 'weeklyPlan:9', ${'2404318 สัปดาห์ 9: ' + LONG_THAI.slice(30, 100)},
		        'topic', 'duplicate', 'high', 0.9, ${LONG_THAI + LONG_URL}, ${LONG_URL + LONG_URL}, 'ai', 'test-a', 'test-b')
		on conflict (pair_key) do update set reason_th = excluded.reason_th, suggestion_th = excluded.suggestion_th, status = 'open'`;
});
test.afterAll(async () => {
	await db()`delete from courseplat.content_cautions where pair_key = ${PAIR_KEY}`;
});

/** the page never scrolls sideways; boxes that scroll on purpose (the matrix, the header menu) don't count */
async function expectNoPageOverflow(page: Page, where: string) {
	const { sw, cw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
	expect(sw, `${where}: page scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw);
}

async function expectInsideViewport(page: Page, selector: string, where: string) {
	const cw = await page.evaluate(() => document.documentElement.clientWidth);
	const boxes = await page.locator(`${selector} >> visible=true`).evaluateAll((els) => els.map((e) => ({ id: (e as HTMLElement).dataset.testid, ...e.getBoundingClientRect().toJSON() })));
	expect(boxes.length, `${where}: ${selector} visible`).toBeGreaterThan(0);
	for (const b of boxes) {
		expect(b.left, `${where}: ${b.id} left edge`).toBeGreaterThanOrEqual(-1);
		expect(b.right, `${where}: ${b.id} right edge ${b.right} > ${cw}`).toBeLessThanOrEqual(cw + 1);
	}
}

/** wrapped onto more than one line and no wider than its container */
async function expectWrapped(page: Page, selector: string, where: string) {
	const m = await page.locator(selector).first().evaluate((e) => ({ h: e.getBoundingClientRect().height, line: parseFloat(getComputedStyle(e).lineHeight) || 18, sw: e.scrollWidth, cw: e.clientWidth }));
	expect(m.h, `${where}: ${selector} should wrap`).toBeGreaterThan(m.line * 1.5);
	expect(m.sw, `${where}: ${selector} wider than its box`).toBeLessThanOrEqual(m.cw + 1);
}

async function expectDrawerFits(page: Page, where: string) {
	const drawer = page.getByTestId('caution-drawer');
	await expect(drawer).toBeVisible();
	const { sw, cw } = await drawer.evaluate((e) => ({ sw: e.scrollWidth, cw: e.clientWidth }));
	expect(sw, `${where}: drawer content ${sw} wider than the drawer ${cw}`).toBeLessThanOrEqual(cw + 1);
	await expectNoPageOverflow(page, where);
	// exact: "เปิดอยู่" in every caution row contains "ปิด"
	await drawer.getByRole('button', { name: 'ปิด', exact: true }).click();
	await expect(drawer).toBeHidden();
}

test('editor sidebar: every tab fits at 390–1440 px, with a long unbroken caution', async ({ page }) => {
	test.setTimeout(240_000);
	await signInDemo(page, 'prof-thanakrit');
	for (const w of WIDTHS) {
		await page.setViewportSize({ width: w, height: 800 });
		await page.goto(`/teach/${ids.get('2404324')}/edit`);
		await expect(page.getByTestId('tab-cautions')).toBeVisible();
		for (const tab of ['notes', 'history', 'cautions']) {
			const where = `${w}px, tab ${tab}`;
			await page.getByTestId(`tab-${tab}`).click();
			await expect(page.getByTestId(`tab-${tab}`)).toHaveAttribute('aria-selected', 'true');
			await expectNoPageOverflow(page, where);
			await expectInsideViewport(page, '[data-testid^="tab-"]', where);
			if (w < 1024) await page.getByTestId('readiness-sheet').locator('button[aria-expanded="false"]').click();
			await expectInsideViewport(page, '[data-testid="publish"]', where);
			if (w < 1024) await page.getByTestId('readiness-sheet').locator('button[aria-expanded="true"]').click();
		}
		await expectWrapped(page, '[data-testid="editor-cautions"] button:has-text("2404318") [data-testid="editor-caution-reason"]', `${w}px`);
		await page.locator('[data-testid="editor-cautions"] button').filter({ hasText: '2404318' }).first().click();
		await expectDrawerFits(page, `${w}px, editor drawer`);
	}
});

test('/cautions: list, tiles and drawer fit at 390–1440 px; the matrix scrolls inside its own box', async ({ page }) => {
	test.setTimeout(240_000);
	await signInDemo(page, 'staff');
	for (const w of WIDTHS) {
		const where = `${w}px, /cautions`;
		await page.setViewportSize({ width: w, height: 800 });
		await page.goto('/cautions?semester=2569-2');
		await expect(page.getByTestId('tiles')).toBeVisible();
		await expectNoPageOverflow(page, where);
		await expectInsideViewport(page, '[data-testid^="tile-"]', where);
		const row = page.getByTestId('caution-row').filter({ hasText: '2404318' }).first();
		await expectInsideViewport(page, '[data-testid="caution-row"]', where);
		await expectWrapped(page, '[data-testid="caution-row"]:has-text("2404318") [data-testid="caution-reason"]', where);
		await row.click();
		await expectDrawerFits(page, `${where} drawer`);
	}
});
