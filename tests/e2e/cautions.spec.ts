/** Spec 06 Content Caution, offline (AI_OFFLINE=true): AC 3, 4, 5, 6, 7, 9. */
import { createClient } from '@supabase/supabase-js';
import { db, expect, offeringIds, resetNotStarted, signInDemo, test } from './fixtures';

let id429 = '';
test.beforeAll(async () => {
	id429 = (await offeringIds()).get('2404429')!;
});
test.beforeEach(async () => {
	await resetNotStarted();
	await db()`update courseplat.profiles set cautions_seen_at = null where email = 'thanakrit.w@courseplat.test'`;
});
test.afterAll(() => resetNotStarted());

/** act 3: natthida uploads the sample, accepts, and the run finishes */
async function uploadAndRun(page: import('@playwright/test').Page, signIn = true) {
	if (signIn) await signInDemo(page, 'prof-natthida');
	await page.goto(`./teach/${id429}/import`);
	await page.getByTestId('file-input').setInputFiles('fixtures/samples/2404429-syllabus.docx');
	await page.getByTestId('start-import').click();
	await page.waitForURL(/\/review\//, { timeout: 20_000 });
	await page.getByTestId('accept').click();
	await page.waitForURL(/\/edit\/$/);
	await expect(page.getByTestId('run-status')).toContainText('ตรวจเสร็จ', { timeout: 30_000 });
}

test('AC 3: staff see the seeded cautions with the right tiles, list and matrix', async ({ page }) => {
	await signInDemo(page, 'staff');
	await page.goto('./cautions?semester=2569-2');
	await expect(page.getByTestId('scope')).toHaveText('ทั้งภาควิชา');
	await expect(page.getByTestId('tile-high')).toContainText('1');
	await expect(page.getByTestId('tile-medium')).toContainText('1');
	await expect(page.getByTestId('tile-coordinating')).toContainText('0');
	await expect(page.getByTestId('tile-resolved')).toContainText('1');
	await expect(page.getByTestId('caution-row')).toHaveCount(2);
	await expect(page.locator('[data-cell="2404317|2404416"]')).toHaveAttribute('data-worst', 'high');
	await expect(page.locator('[data-cell="2404312|2404317"]')).toHaveAttribute('data-worst', 'medium');
	await page.getByTestId('filter-sev-info').click();
	await expect(page.getByTestId('caution-row')).toHaveCount(5);
	await page.getByTestId('filter-status-intentional').click();
	await expect(page.getByTestId('caution-row')).toHaveCount(6);
});

test('AC 9 + AC 4: natthida starts empty; after the upload she has 1 high and 4 medium, incl. the Dye reading', async ({ page }) => {
	test.setTimeout(120_000);
	await signInDemo(page, 'prof-natthida');
	await page.goto('./cautions');
	await expect(page.getByTestId('cautions-empty')).toHaveText('ยังไม่มีข้อควรระวังสำหรับวิชาของคุณ');
	await uploadAndRun(page, false);
	await page.goto('./cautions');
	await expect(page.getByTestId('tile-high')).toContainText('1');
	await expect(page.getByTestId('tile-medium')).toContainText('4');
	await expect(page.locator('[data-testid="my-courses"] [data-course="2404429"] a').first()).toHaveAttribute('href', `/pa-courseplat/teach/${id429}/edit/`);
	const rows = await db()<{ kind: string; severity: string; reason_th: string; a_label: string; b_label: string; source: string }[]>`
		select kind::text, severity::text, reason_th, a_label, b_label, source from courseplat.content_cautions where (a_offering_id = ${id429} or b_offering_id = ${id429}) and status = 'open'`;
	const assignment = rows.find((r) => r.kind === 'assignment')!;
	expect(assignment.severity).toBe('high');
	expect(assignment.reason_th).toContain('ไม่เกิน 1 สัปดาห์');
	expect(rows.find((r) => r.kind === 'reading' && r.source === 'rule')?.severity).toBe('medium');
	expect(rows.some((r) => r.kind === 'topic' && /2404324 สัปดาห์ [456]/.test(r.a_label + r.b_label) && r.severity !== 'info')).toBe(true);
	expect(rows.some((r) => r.kind === 'topic' && /2404318/.test(r.a_label + r.b_label))).toBe(true);
	expect(rows.filter((r) => r.severity === 'info')).toHaveLength(1);
});

test('AC 5: thanakrit gets the badge, sees only cautions on his courses, and the coordination thread reaches natthida', async ({ page, browser }) => {
	test.setTimeout(120_000);
	await uploadAndRun(page);
	const other = await browser.newContext();
	const tp = await other.newPage();
	await signInDemo(tp, 'prof-thanakrit');
	await expect(tp.getByTestId('caution-badge')).toBeVisible();
	expect(Number(await tp.getByTestId('caution-badge').textContent())).toBeGreaterThanOrEqual(1);
	await tp.goto('./cautions');
	const labels = await tp.getByTestId('caution-row').allTextContents();
	expect(labels.length).toBeGreaterThan(0);
	expect(labels.every((l) => /2404324|2404412|2404480/.test(l))).toBe(true);
	await tp.getByTestId('caution-row').filter({ hasText: 'งาน' }).first().click();
	await tp.getByTestId('resolve-coordinate').click();
	await tp.getByTestId('comment-input').fill('ขอปรับงานของ 2404429 เป็น options memo นะคะ');
	await tp.getByTestId('comment-send').click();
	await expect(tp.getByTestId('comments')).toContainText('options memo');
	await other.close();

	await page.goto('./cautions?status=open,coordinating');
	await page.getByTestId('caution-row').filter({ hasText: 'งาน' }).first().click();
	await expect(page.getByTestId('comments')).toContainText('ขอปรับงานของ 2404429 เป็น options memo นะคะ');
	await expect(page.getByTestId('drawer-status')).toHaveText('กำลังประสานงาน');
});

test('AC 6: changing week 2 and re-running dismisses that caution; the seeded intentional one is untouched', async ({ page }) => {
	test.setTimeout(120_000);
	await uploadAndRun(page);
	const before = await db()<{ status: string; updated_at: Date }[]>`select status::text, updated_at from courseplat.content_cautions where source = 'seed' and status = 'intentional'`;
	const week2 = page.locator('[data-testid="week-row"][data-week="2"] input[aria-label^="หัวข้อ"]');
	await week2.fill('การจัดการงบประมาณโครงการ (หัวข้อทดสอบ)');
	await expect(page.getByTestId('save-status')).toContainText('บันทึกแล้ว', { timeout: 15_000 });
	await page.getByTestId('tab-cautions').click();
	await page.getByTestId('run-check').click();
	await expect(page.getByTestId('run-status')).toContainText('ตรวจเสร็จ', { timeout: 30_000 });
	const wk2 = await db()<{ status: string; resolution_note: string | null }[]>`
		select status::text, resolution_note from courseplat.content_cautions where (a_offering_id = ${id429} or b_offering_id = ${id429}) and (a_ref = 'weeklyPlan:2' or b_ref = 'weeklyPlan:2') and source = 'ai'`;
	expect(wk2.length).toBeGreaterThan(0);
	expect(wk2.every((r) => r.status === 'dismissed' && r.resolution_note === 'ไม่พบความทับซ้อนนี้ในการตรวจครั้งล่าสุด')).toBe(true);
	const after = await db()<{ status: string; updated_at: Date }[]>`select status::text, updated_at from courseplat.content_cautions where source = 'seed' and status = 'intentional'`;
	expect(after).toEqual(before);
});

test('@student AC 7: no caution menu, redirect with a notice, no rows through the API, nothing on student pages', async ({ page }) => {
	await signInDemo(page, 'student');
	await expect(page.getByRole('navigation', { name: 'เมนู' }).getByRole('link', { name: 'ข้อควรระวังด้านเนื้อหา' })).toHaveCount(0);
	await page.goto('./cautions');
	await expect(page).toHaveURL(/\/courses\/$/);
	await expect(page.getByTestId('flash')).toContainText('หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น');

	const sb = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false }, db: { schema: 'courseplat' } });
	await sb.auth.signInWithPassword({ email: 'student.pa67@courseplat.test', password: process.env.DEMO_ACCOUNT_PASSWORD! });
	expect((await sb.from('content_cautions').select('id')).data ?? []).toEqual([]);
	expect((await sb.from('caution_comments').select('id')).data ?? []).toEqual([]);

	const seeded = await db()<{ reason_th: string; suggestion_th: string }[]>`select reason_th, suggestion_th from courseplat.content_cautions where source = 'seed'`;
	// the cautions' own wording and the caution UI's labels; plain words like "ต่อยอด" also appear in syllabi
	const forbidden = [...seeded.flatMap((c) => [c.reason_th, c.suggestion_th]), 'ข้อควรระวังด้านเนื้อหา', 'ระดับสูง', 'ระดับกลาง', 'ความใกล้เคียง', 'ตั้งใจให้ต่อยอด', 'กำลังประสานงาน'];
	const now = await offeringIds('2569-2');
	const before = await offeringIds('2568-2');
	const versionRow = await db()<{ id: string }[]>`select v.id from courseplat.offering_versions v join courseplat.offerings o on o.id = v.offering_id where o.course_code = '2404324' and o.semester_id = '2568-2' limit 1`;
	const routes = ['/courses', '/courses/2404436/2569-2', '/courses/2400114/2569-2', '/courses/2404317/2569-2', '/courses/2404416/2569-2', `/compare?o=${now.get('2400114')},${now.get('2404436')}`, '/curriculum', `/courses/2404324/versions/${versionRow[0].id}`, `/compare?o=${now.get('2404324')},${before.get('2404429')}`];
	for (const r of routes) {
		await page.goto('.' + r);
		const text = await page.locator('main, body').first().innerText();
		for (const f of forbidden) expect(text.includes(f), `${r} shows "${f}"`).toBe(false);
	}
});

test('AC 8 (editor): after a run whose AI part failed, the editor says only the basic checks ran', async ({ page }) => {
	await signInDemo(page, 'prof-natthida');
	await page.goto(`./teach/${id429}/edit`);
	await page.getByTestId('start-blank').click();
	await expect(page.getByTestId('syllabus-form')).toBeVisible();
	await db()`insert into courseplat.caution_runs (offering_id, trigger, status, error, offline) values (${id429}, 'manual', 'failed', 'Gemini quota (test)', false)`;
	await page.reload();
	await page.getByTestId('tab-cautions').click();
	await expect(page.getByTestId('ai-failed')).toHaveText('ตรวจด้วย AI ไม่สำเร็จ แสดงเฉพาะผลการตรวจพื้นฐาน');
});

test.describe('AC 7 as a viewer (someone no longer in the staff directory)', () => {
	test.skip(({ browserName }) => browserName !== 'chromium', 'changes shared data; run once');

	test('no caution menu, redirect with a notice, no rows through the API', async ({ page }) => {
		test.setTimeout(120_000);
		const sql = db();
		const email = 'natthida.k@courseplat.test';
		const direct = async () => {
			const sb = createClient(process.env.PUBLIC_SUPABASE_URL!, process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false }, db: { schema: 'courseplat' } });
			await sb.auth.signInWithPassword({ email, password: process.env.DEMO_ACCOUNT_PASSWORD! });
			return sb;
		};
		// as an instructor she sees the cautions on 2404429 through the API …
		await uploadAndRun(page);
		expect(((await (await direct()).from('content_cautions').select('id')).data ?? []).length).toBeGreaterThan(0);
		try {
			await sql`delete from courseplat.staff_directory where email = ${email}`;
			await page.goto('./courses');
			await expect(page.getByTestId('role-chip')).toHaveText('ผู้เยี่ยมชม');
			await expect(page.getByRole('navigation', { name: 'เมนู' }).getByRole('link', { name: 'ข้อควรระวังด้านเนื้อหา' })).toHaveCount(0);
			await page.goto('./cautions');
			await expect(page).toHaveURL(/\/courses\/$/);
			await expect(page.getByTestId('flash')).toContainText('หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น');
			// … and as a viewer none
			const sb = await direct();
			expect((await sb.from('content_cautions').select('id')).data ?? []).toEqual([]);
			expect((await sb.from('caution_comments').select('id')).data ?? []).toEqual([]);
		} finally {
			await sql`
				insert into courseplat.staff_directory (email, role, title_th, name_th, name_en)
				values (${email}, 'instructor', 'อ.ดร.', 'ณัฐธิดา แก้วมณี', 'Natthida Kaewmanee')
				on conflict (email) do update set role = 'instructor'`;
		}
		await page.goto('./teach');
		await expect(page.getByTestId('role-chip')).toHaveText('อาจารย์');
	});
});
