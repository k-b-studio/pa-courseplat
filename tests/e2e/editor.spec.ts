/** Spec 05 R1–R10 (P3): the manual editor. Works on 2404429 (2/2569), reset before and after each test. */
import { db, expect, offeringIds, resetNotStarted, signInDemo, test } from './fixtures';

let id429 = '';
test.beforeAll(async () => {
	id429 = (await offeringIds()).get('2404429')!;
});
test.beforeEach(() => resetNotStarted());
test.afterAll(() => resetNotStarted());

const openEditor = async (page: import('@playwright/test').Page) => {
	await signInDemo(page, 'prof-natthida');
	await page.goto(`/teach/${id429}/edit`);
};
const copy2568 = async (page: import('@playwright/test').Page) => {
	await page.getByTestId('copy-version').filter({ hasText: '2/2568' }).click();
	await expect(page.getByTestId('syllabus-form')).toBeVisible();
};

test('R2 + AC 8: a not-started course offers four ways to start and shows last year\'s handover note', async ({ page }) => {
	await openEditor(page);
	await expect(page.getByTestId('start-options')).toBeVisible();
	await expect(page.getByTestId('start-options')).toContainText('อัปโหลดไฟล์');
	await expect(page.getByTestId('start-options')).toContainText('วางข้อความ');
	await expect(page.getByTestId('start-options')).toContainText('เริ่มจากฟอร์มเปล่า');
	await expect(page.getByTestId('notes')).toContainText('นิสิตสะท้อนว่าสัปดาห์ที่ 2');
});

test('AC 7: copying the 2/2568 version clears key-date dates and weekly instructors', async ({ page }) => {
	await openEditor(page);
	await copy2568(page);
	const [o] = await db()<{ syllabus: any; status: string; cloned_from: string | null }[]>`select syllabus, status::text, cloned_from from courseplat.offerings where id = ${id429}`;
	expect(o.status).toBe('draft');
	expect(o.cloned_from).toBe((await offeringIds('2568-2')).get('2404429'));
	expect(o.syllabus.keyDates.every((k: any) => k.date === null)).toBe(true);
	expect(o.syllabus.weeklyPlan.every((w: any) => w.instructorIds.length === 0)).toBe(true);
});

test('AC 5: weights 30/30/35 show "รวม 95%" and block publishing; 100 enables it; autosave', async ({ page }) => {
	await openEditor(page);
	await copy2568(page);
	await expect(page.getByTestId('publish').first()).toBeEnabled({ timeout: 15_000 });
	const weights = page.getByTestId('eval-weight');
	const n = await weights.count();
	for (let i = 0; i < n; i++) await weights.nth(i).fill('0');
	await weights.nth(0).fill('30');
	await weights.nth(1).fill('30');
	await weights.nth(2).fill('35');
	await expect(page.getByTestId('eval-total')).toHaveText('รวม 95% — ต้องครบ 100%');
	await expect(page.getByTestId('publish').first()).toBeDisabled();
	await expect(page.getByTestId('readiness-list').first()).toContainText('น้ำหนักคะแนนรวม 95% — ต้องครบ 100%');
	await weights.nth(2).fill('40');
	await expect(page.getByTestId('eval-total')).toHaveText('รวม 100%');
	await expect(page.getByTestId('save-status')).toContainText('บันทึกแล้ว', { timeout: 15_000 });
	await expect(page.getByTestId('publish').first()).toBeEnabled();
	const [o] = await db()<{ syllabus: any }[]>`select syllabus from courseplat.offerings where id = ${id429}`;
	expect(o.syllabus.evaluation.items.slice(0, 3).map((e: any) => e.weightPercent)).toEqual([30, 30, 40]);
});

test('AC 4 (manual part): an objective without a PLO blocks publishing', async ({ page }) => {
	await openEditor(page);
	await copy2568(page);
	const first = page.getByTestId('objective-row').first();
	for (const chip of await first.locator('button[data-plo][aria-pressed="true"]').all()) await chip.click();
	await expect(page.getByTestId('readiness-list').first()).toContainText('วัตถุประสงค์แต่ละข้อต้องเชื่อมกับ PLO อย่างน้อย 1 รายการ');
	await expect(page.getByTestId('publish').first()).toBeDisabled();
});

test('AC 6: two tabs on one draft get the conflict dialog; nothing is lost silently', async ({ page, context }) => {
	await openEditor(page);
	await copy2568(page);
	await expect(page.getByTestId('save-status')).not.toContainText('กำลังบันทึก');
	const second = await context.newPage();
	await second.goto(`/teach/${id429}/edit`);
	await expect(second.getByTestId('syllabus-form')).toBeVisible();

	await page.locator('#f-focus').fill('ฉบับแท็บแรก: ภาคการศึกษานี้เน้นเทคนิคการวิเคราะห์นโยบายอย่างเป็นขั้นตอนและการเขียน options memo');
	await expect(page.getByTestId('save-status')).toContainText('บันทึกแล้ว', { timeout: 15_000 });

	await second.locator('#f-focus').fill('ฉบับแท็บที่สอง: ภาคการศึกษานี้เน้นกรณีศึกษานโยบายของไทยและการทำงานกลุ่มแบบห้องปฏิบัติการ');
	await expect(second.getByTestId('conflict-dialog')).toBeVisible({ timeout: 15_000 });
	await expect(second.getByTestId('conflict-dialog')).toContainText('ภาพรวมรายวิชา');
	await second.getByTestId('load-latest').click();
	await expect(second.locator('#f-focus')).toHaveValue(/ฉบับแท็บแรก/);
});

test('AC 11 + R8: the history panel diffs 2404324 2/2568 against the current draft', async ({ page }) => {
	const ids = await offeringIds();
	await signInDemo(page, 'prof-thanakrit');
	await page.goto(`/teach/${ids.get('2404324')}/edit`);
	await page.getByTestId('tab-history').click();
	await page.getByTestId('history').getByTestId('compare-version').first().click();
	const diff = page.getByTestId('diff');
	await expect(diff.locator('[data-week="12"]')).toContainText('นโยบายเชิงพฤติกรรมและแนวคิด Nudge');
	await expect(diff.getByTestId('diff-eval').filter({ hasText: 'สอบกลางภาค' })).toHaveText('~ สอบกลางภาค: 30% → 25%');
});

test('R7: preview as student renders the student blocks from the draft', async ({ page }) => {
	await openEditor(page);
	await copy2568(page);
	await page.getByTestId('preview-toggle').click();
	await expect(page.getByTestId('block-overview')).toBeVisible();
	await expect(page.getByTestId('block-timetable')).toContainText('Bardach');
});

test('R9: an instructor edits the note of a section they teach', async ({ page }) => {
	await openEditor(page);
	await copy2568(page);
	const [s] = await db()<{ id: string; note: string }[]>`select id, note from courseplat.sections where offering_id = ${id429} and section_no = 1`;
	try {
		const box = page.getByTestId('section-details').first();
		await box.locator('input[name="note"]').fill('นำเครื่องคอมพิวเตอร์มาในสัปดาห์ที่ 5 (ตัวอย่าง)');
		await box.getByRole('button', { name: 'บันทึกตอนเรียน' }).click();
		await expect(box.getByRole('status')).toHaveText('บันทึกตอนเรียนแล้ว');
		const [after] = await db()<{ note: string }[]>`select note from courseplat.sections where id = ${s.id}`;
		expect(after.note).toBe('นำเครื่องคอมพิวเตอร์มาในสัปดาห์ที่ 5 (ตัวอย่าง)');
	} finally {
		await db()`update courseplat.sections set note = ${s.note} where id = ${s.id}`;
	}
});
