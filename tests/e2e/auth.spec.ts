/** Spec 03 AC 4, 5, 6 against the seeded shared project. */
import { NO_DEMO_URL } from '../../playwright.config';
import { db, expect, offeringIds, signInDemo, test } from './fixtures';

const FORBIDDEN_LOG = /status of 403/;

test.describe('demo accounts land on their home route (AC 4)', () => {
	test('@student lands on /courses and sees no teaching, caution or staff menu', async ({ page }) => {
		await signInDemo(page, 'student');
		await expect(page).toHaveURL(/\/courses\/$/);
		await expect(page.getByTestId('role-chip')).toHaveText('นิสิต');
		await expect(page.getByTestId('demo-data-banner')).toHaveText('ข้อมูลตัวอย่างเพื่อการสาธิต');
		const nav = page.getByRole('navigation', { name: 'เมนู' });
		await expect(nav.getByRole('link', { name: 'รายวิชา' })).toBeVisible();
		for (const label of ['รายวิชาที่สอน', 'ข้อควรระวังด้านเนื้อหา', 'ภาควิชา']) await expect(nav.getByRole('link', { name: label })).toHaveCount(0);
	});

	test('@student is redirected away from /teach, /cautions and /admin with a Thai notice', async ({ page }) => {
		await signInDemo(page, 'student');
		for (const [path, notice] of [
			['/teach', 'หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น'],
			['/cautions', 'หน้านี้สำหรับอาจารย์และเจ้าหน้าที่ภาควิชาเท่านั้น'],
			['/admin', 'หน้านี้สำหรับเจ้าหน้าที่ภาควิชาเท่านั้น']
		]) {
			await page.goto('.' + path);
			await expect(page).toHaveURL(/\/courses\/$/);
			await expect(page.getByTestId('flash')).toContainText(notice);
		}
	});

	test('อ.ดร.ณัฐธิดา lands on /teach, opens 2404429 and gets 403 for 2404324', async ({ page, allowConsole }) => {
		allowConsole(FORBIDDEN_LOG);
		const ids = await offeringIds();
		await signInDemo(page, 'prof-natthida');
		await expect(page).toHaveURL(/\/teach\/$/);
		await expect(page.getByTestId('role-chip')).toHaveText('อาจารย์');
		await page.locator('a[data-course="2404429"]').click();
		await expect(page.getByTestId('editor-title')).toContainText('2404429');

		const res = await page.goto(`./teach/${ids.get('2404324')}/edit`);
		expect(res?.status()).toBe(403);
		await expect(page.getByTestId('error-page')).toContainText('คุณไม่มีสิทธิ์แก้ไขรายวิชานี้');
	});

	test('ผศ.ดร.ธนกฤต sees the offerings he coordinates or teaches', async ({ page }) => {
		await signInDemo(page, 'prof-thanakrit');
		await expect(page).toHaveURL(/\/teach\/$/);
		const list = page.getByTestId('teach-list');
		for (const code of ['2404324', '2404412', '2404480']) await expect(list.locator(`a[data-course="${code}"]`)).toBeVisible();
		await expect(list.locator('a[data-course="2404429"]')).toHaveCount(0);
	});

	test('staff lands on /admin and can open every editor', async ({ page }) => {
		const ids = await offeringIds();
		expect(ids.size).toBe(14);
		await signInDemo(page, 'staff');
		await expect(page).toHaveURL(/\/admin\/$/);
		await expect(page.getByTestId('role-chip')).toHaveText('เจ้าหน้าที่');
		for (const [code, id] of ids) {
			const res = await page.goto(`./teach/${id}/edit`);
			expect(res?.status(), code).toBe(200);
			await expect(page.getByTestId('editor-title')).toContainText(code);
		}
	});

	test('the header switches demo accounts without going back to the landing page', async ({ page }) => {
		await signInDemo(page, 'student');
		await page.locator('header summary').click();
		await page.locator('button[data-switch="staff"]').click();
		await expect(page).toHaveURL(/\/admin\/$/);
		await expect(page.getByTestId('role-chip')).toHaveText('เจ้าหน้าที่');
	});
});

test.describe('staff directory changes apply on the next page load (AC 5)', () => {
	test.skip(({ browserName }) => browserName !== 'chromium', 'changes shared data; run once');

	test('promote to staff, remove from the directory, restore', async ({ page }) => {
		const sql = db();
		const email = 'natthida.k@courseplat.test';
		await signInDemo(page, 'prof-natthida');
		try {
			await sql`update courseplat.staff_directory set role = 'staff' where email = ${email}`;
			await page.reload();
			await expect(page.getByTestId('role-chip')).toHaveText('เจ้าหน้าที่');

			await sql`delete from courseplat.staff_directory where email = ${email}`;
			await page.goto('./courses');
			await expect(page.getByTestId('role-chip')).toHaveText('ผู้เยี่ยมชม');
			await expect(page.getByTestId('viewer-banner')).toBeVisible();
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

test.describe('without demo mode (AC 6)', () => {
	test('no demo panel, and /auth/demo answers 404', async ({ page, request, allowConsole }) => {
		allowConsole(/status of 404/);
		await page.goto(NO_DEMO_URL + '/');
		await expect(page.getByRole('button', { name: 'เข้าสู่ระบบด้วยบัญชีจุฬาฯ' })).toBeVisible();
		await expect(page.getByTestId('demo-panel')).toHaveCount(0);
		expect((await request.get(NO_DEMO_URL + '/auth/demo/')).status()).toBe(404);
		const post = await request.post(NO_DEMO_URL + '/auth/demo/', { form: { key: 'staff' }, headers: { origin: new URL(NO_DEMO_URL).origin } });
		expect(post.status()).toBe(404);
	});
});
