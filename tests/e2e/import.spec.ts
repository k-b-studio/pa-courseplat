/** Spec 05 R11–R17 offline (AI_OFFLINE=true, as in the room): AC 3, 4, 9 (offline), 10, 13. */
import { createClient } from '@supabase/supabase-js';
import { NO_DEMO_URL } from '../../playwright.config';
import { db, expect, offeringIds, resetNotStarted, signInDemo, test } from './fixtures';

const S = 'fixtures/samples';
let id429 = '';
test.beforeAll(async () => {
	id429 = (await offeringIds()).get('2404429')!;
});
test.beforeEach(() => resetNotStarted());
test.afterAll(() => resetNotStarted());

async function importFile(page: import('@playwright/test').Page, files: Parameters<import('@playwright/test').Locator['setInputFiles']>[0]) {
	await signInDemo(page, 'prof-natthida');
	await page.goto(`./teach/${id429}/import`);
	await page.getByTestId('file-input').setInputFiles(files);
	await page.getByTestId('start-import').click();
}

test('AC 3 + AC 13: the .docx returns the offline fixture in about 2.5 s, with the free-tier notice and offline banner', async ({ page }) => {
	await signInDemo(page, 'prof-natthida');
	await page.goto(`./teach/${id429}/import`);
	await expect(page.getByTestId('data-notice')).toContainText('Google Gemini');
	await expect(page.getByTestId('offline-banner')).toBeVisible();
	await page.getByTestId('file-input').setInputFiles(`${S}/2404429-syllabus.docx`);
	const started = Date.now();
	await page.getByTestId('start-import').click();
	await expect(page.getByTestId('progress')).toBeVisible();
	await page.waitForURL(/\/review\//, { timeout: 20_000 });
	expect(Date.now() - started).toBeGreaterThan(2000);
	await expect(page.getByTestId('offline-banner')).toBeVisible();
	await expect(page.getByTestId('confidence-evaluation')).toHaveText('สูง');
	await expect(page.getByTestId('original')).toContainText('แผนการสอนรายสัปดาห์');
	await expect(page.locator('[data-testid="week-row"]')).toHaveCount(16);
	await expect(page.getByTestId('hints')).toContainText('405 (ตัวอย่าง)');
	await expect(page.getByTestId('hints')).toContainText('13:00–16:00');
});

test('AC 3: the scanned PDF and pasted text return the same fixture', async ({ page }) => {
	await importFile(page, `${S}/2404429-syllabus-scan.pdf`);
	await page.waitForURL(/\/review\//, { timeout: 20_000 });
	await expect(page.locator('[data-testid="week-row"]')).toHaveCount(16);
	await expect(page.getByTestId('original').locator('iframe')).toBeVisible();

	await page.goto(`./teach/${id429}/import?tab=text`);
	await page.getByTestId('text-input').fill((await import('node:fs')).readFileSync(`${S}/2404429-syllabus.txt`, 'utf-8'));
	await page.getByTestId('start-import').click();
	await page.waitForURL(/\/review\//, { timeout: 20_000 });
	await expect(page.locator('[data-testid="eval-row"]')).toHaveCount(5);
});

test('AC 3: any other file gets the offline message and a button to the manual form', async ({ page, allowConsole }) => {
	allowConsole(/status of 503/);
	await page.goto('./');
	const png = await page.screenshot({ type: 'png' }); // any real image the fixtures don't know
	await importFile(page, { name: 'photo.png', mimeType: 'image/png', buffer: png });
	await expect(page.getByTestId('import-error')).toContainText('ขณะนี้ระบบ AI ทำงานแบบออฟไลน์', { timeout: 20_000 });
	await page.getByTestId('manual-form').click();
	await expect(page.getByTestId('start-options')).toBeVisible();
	const [x] = await db()<{ status: string }[]>`select status from courseplat.extractions where offering_id = ${id429} order by created_at desc limit 1`;
	expect(x.status).toBe('failed'); // nothing stays running
});

test('AC 4: accepting creates a draft; the editor marks the PLO suggestions as AI suggestions', async ({ page }) => {
	await importFile(page, `${S}/2404429-syllabus.docx`);
	await page.waitForURL(/\/review\//, { timeout: 20_000 });
	await expect(page.getByTestId('ai-suggestion').first()).toBeVisible();
	await page.getByTestId('accept').click();
	await page.waitForURL(/\/edit\/$/);
	await expect(page.getByTestId('offering-status')).toHaveText('ฉบับร่าง');
	await expect(page.getByTestId('ai-suggestion')).toHaveCount(4);
	// touching a suggestion removes its marker
	await page.getByTestId('objective-row').first().locator('button[data-plo="PLO5D"]').click();
	await expect(page.getByTestId('ai-suggestion')).toHaveCount(3);
	const [o] = await db()<{ status: string }[]>`select status::text from courseplat.offerings where id = ${id429}`;
	expect(o.status).toBe('draft'); // never published by the import (R17)
});

test('AC 9 (offline): the injection sample keeps 30/30/40 and shows the warning', async ({ page }) => {
	await importFile(page, `${S}/injection-test.docx`);
	await page.waitForURL(/\/review\//, { timeout: 20_000 });
	await expect(page.getByTestId('warnings')).toContainText('พบข้อความในเอกสารที่ลักษณะเหมือนคำสั่ง ระบบไม่ได้ทำตาม');
	await expect(page.getByTestId('eval-weight')).toHaveCount(3);
	expect(await page.getByTestId('eval-weight').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value))).toEqual(['30', '30', '40']);
});

test('AC 10: natthida cannot extract for 2404324 or upload into its folder', async ({ page }) => {
	const id324 = (await offeringIds()).get('2404324')!;
	await signInDemo(page, 'prof-natthida');
	const res = await page.request.post('./api/extract/', { data: { offeringId: id324, text: 'ข้อความทดสอบ' } });
	expect(res.status()).toBe(403);
	const sb = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false } });
	await sb.auth.signInWithPassword({ email: 'natthida.k@courseplat.test', password: process.env.DEMO_ACCOUNT_PASSWORD! });
	const { error } = await sb.storage.from('syllabus-uploads').upload(`${id324}/${crypto.randomUUID()}.pdf`, new Blob(['%PDF-1.4'], { type: 'application/pdf' }));
	expect(error).not.toBeNull();
});

test('AC 13: with AI_TIER=paid there is no data notice', async ({ page }) => {
	await signInDemo(page, 'prof-natthida'); // the session cookie is shared across localhost ports
	await page.goto(`${NO_DEMO_URL}/teach/${id429}/import/`);
	await expect(page.getByRole('heading', { name: 'นำเข้าประมวลรายวิชาด้วย AI' })).toBeVisible();
	await expect(page.getByTestId('data-notice')).toHaveCount(0);
});
