/** Spec 04 acceptance criteria as the demo student (cohort 67, PA). */
import type { Page } from '@playwright/test';
import { expect, offeringIds, signInDemo, test } from './fixtures';

/** Page wider than the visual viewport = a horizontal scrollbar (on phones WebKit widens the layout viewport instead). */
const noHorizontalScroll = async (page: Page) =>
	expect(await page.evaluate(() => document.documentElement.scrollWidth - Math.round(window.visualViewport?.width ?? window.innerWidth))).toBeLessThanOrEqual(0);

test.beforeEach(async ({ page }) => signInDemo(page, 'student'));

test('@student AC 1: /courses defaults to 2/2569 with published offerings and my badges', async ({ page }) => {
	await expect(page.getByTestId('semester-select')).toHaveValue('2569-2');
	const cards = page.getByTestId('course-card');
	await expect(cards).toHaveCount(10);
	await expect(page.locator('[data-course="2404324"] [data-testid="status-badge"]')).toHaveText('บังคับสาขา (PA)');
	await page.getByTestId('filter-published').uncheck();
	await expect(cards).toHaveCount(14);
	const c429 = page.locator('[data-testid="course-card"][data-course="2404429"]');
	await expect(c429.getByTestId('status-badge')).toHaveText('วิชาเลือกกลุ่ม: สายบริหารงานคลัง · สายนโยบายและการวางแผน');
	await expect(c429.getByTestId('unpublished')).toHaveText('ยังไม่เผยแพร่ประมวลรายวิชา');
	await noHorizontalScroll(page);
});

test('@student AC 2: the policy-and-planning track filter', async ({ page }) => {
	await page.getByTestId('filter-published').uncheck();
	await page.getByTestId('filter-track').selectOption('pa-policy');
	const codes = await page.getByTestId('course-card').evaluateAll((els) => els.map((e) => e.getAttribute('data-course')).sort());
	expect(codes).toEqual(['2404318', '2404422', '2404429']); // 2404431 and 2404470 are not offered in 2/2569
});

test('@student AC 3: 2404324 renders the nine sections, a 100% donut, week 8 as exam, week 1 on the start date', async ({ page }) => {
	await page.goto('/courses/2404324/2569-2');
	for (const id of ['overview', 'objectives', 'approach', 'evaluation', 'resources', 'work', 'professors', 'timetable', 'sections'])
		await expect(page.getByTestId(`block-${id}`)).toBeVisible();
	await expect(page.getByTestId('block-overview')).toContainText('ภาพรวมรายวิชา · Course Overview');
	await expect(page.getByTestId('donut').first()).toHaveAttribute('data-total', '100');
	await expect(page.locator('[data-week="8"]')).toHaveAttribute('data-exam', 'true');
	await expect(page.locator('[data-week="1"]')).toHaveAttribute('data-date', '2027-01-11');
	await expect(page.getByTestId('at-a-glance')).toBeVisible();
	await noHorizontalScroll(page);
});

test('@student AC 4: 2400114 has two sections, each professor with their own section', async ({ page }) => {
	await page.goto('/courses/2400114/2569-2');
	await expect(page.locator('[data-testid="sections-list"] > li')).toHaveCount(2);
	await expect(page.locator('[data-testid="professor"][data-name="อภิชาติ สุวรรณรัตน์"] [data-testid="professor-sections"]')).toHaveText('1');
	await expect(page.locator('[data-testid="professor"][data-name="วิภาวดี จันทร์เพ็ญ"] [data-testid="professor-sections"]')).toHaveText('2');
	await expect(page.locator('[data-section="2"]')).toContainText('เน้นกรณีศึกษาเปรียบเทียบต่างประเทศ');
});

test('@student AC 5: 2404412 shows three instructors with the weeks they lead', async ({ page }) => {
	await page.goto('/courses/2404412/2569-2');
	const weeks = (name: string) => page.locator(`[data-testid="professor"][data-name="${name}"] [data-testid="professor-weeks"]`);
	await expect(page.getByTestId('professor')).toHaveCount(3);
	await expect(weeks('ธนกฤต วงศ์ประเสริฐ')).toHaveText('1–5, 16');
	await expect(weeks('กิตติพงษ์ บุญมา')).toHaveText('6–7, 9–10, 16');
	await expect(weeks('ชลธิชา มีสุข')).toHaveText('11–16');
});

test('@student AC 6: related courses come from the catalog only', async ({ page }) => {
	await page.goto('/courses/2404324/2569-2');
	await expect(page.getByTestId('related-builds-for')).toContainText('2404470');
	await page.goto('/courses/2404436/2569-2');
	await expect(page.getByTestId('related-courses')).not.toContainText('2400114');
});

test('@student compare: shared reading, shared topics and a heavy week', async ({ page }) => {
	// the 2/2569 upload of 2404429 arrives in P4; its 2/2568 version already shares Dye and the policy cycle
	const now = await offeringIds('2569-2');
	const before = await offeringIds('2568-2');
	await page.goto(`/compare?o=${now.get('2404324')},${before.get('2404429')}`);
	await expect(page.getByTestId('compare-column')).toHaveCount(2);
	await expect(page.locator('[data-testid="compare-readings"] [data-shared="true"]').first()).toContainText('Understanding Public Policy');
	await expect(page.getByTestId('shared-topic').filter({ hasText: 'policy cycle' }).first()).toBeVisible();
	await expect(page.locator('[data-testid="heatmap-total"] [data-week="12"]')).toHaveAttribute('data-heavy', 'true');
	await noHorizontalScroll(page);
});

test('@student the compare tray: add two courses from the list, then compare', async ({ page }) => {
	await page.locator('[data-course="2404324"] [data-testid="compare-toggle"]').click();
	await page.locator('[data-course="2404317"] [data-testid="compare-toggle"]').click();
	await expect(page.getByTestId('compare-tray')).toContainText('(2/3)');
	await page.getByTestId('compare-go').click();
	await expect(page).toHaveURL(/\/compare\?o=/);
	await expect(page.getByTestId('compare-column')).toHaveCount(2);
});

test('@student AC 9: a guessed URL for a draft shows "not published", never the draft', async ({ page }) => {
	await page.goto('/courses/2404318/2569-2');
	await expect(page.getByTestId('not-published')).toContainText('ยังไม่เผยแพร่ประมวลรายวิชา');
	await expect(page.getByTestId('block-overview')).toHaveCount(0);
	await expect(page.locator('body')).not.toContainText('แผนการติดตามและประเมินผลโครงการภาครัฐ');
});

test('@student past versions are read-only snapshots', async ({ page }) => {
	await page.goto('/courses/2404324/2569-2');
	await page.getByTestId('past-versions').getByRole('link', { name: '2/2568' }).click();
	await expect(page.getByTestId('version-note')).toContainText('2/2568');
	await expect(page.getByTestId('block-timetable')).not.toContainText('นโยบายเชิงพฤติกรรม');
});

test('@student curriculum map (Should): official examples, published coverage, my curriculum', async ({ page }) => {
	await page.goto('/curriculum');
	const row = page.locator('[data-testid="plo-matrix"] tr[data-course="2404324"]');
	await expect(row.locator('td').nth(1)).toContainText('●'); // PLO1D: an official example course
	await expect(row.locator('td').nth(1)).toContainText('◐'); // and a published CLO maps to it
	expect(Number(await page.locator('tfoot [data-plo="PLO1D"]').textContent())).toBeGreaterThan(0);
	await noHorizontalScroll(page);
	await page.getByRole('tab', { name: 'โครงสร้างหลักสูตร PA' }).click();
	await expect(page.getByTestId('requirements-polsci-2564')).toBeVisible();
	await expect(page.getByTestId('requirements-polsci-2569')).toHaveCount(0);
	await expect(page.getByTestId('requirements-polsci-2564')).toContainText('2404324');
});
