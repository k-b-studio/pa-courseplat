/**
 * E2E against the seeded shared project (spec 08). `npm run test:e2e` builds first; two preview
 * servers run the same build, one in demo mode and one without it (spec 03 AC 6), because
 * PUBLIC_DEMO_MODE is read at run time ($env/dynamic/public).
 * Tests run one at a time: the demo database is shared state.
 */
import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

if (existsSync('.env')) process.loadEnvFile('.env');

export const DEMO_URL = 'http://localhost:4173';
export const NO_DEMO_URL = 'http://localhost:4174';

export default defineConfig({
	testDir: 'tests/e2e',
	workers: 1,
	fullyParallel: false,
	retries: 0,
	timeout: 45_000,
	expect: { timeout: 10_000 },
	reporter: [['list']],
	use: { baseURL: DEMO_URL, locale: 'th-TH', timezoneId: 'Asia/Bangkok', trace: 'retain-on-failure' },
	webServer: [
		{ command: 'npx vite preview --port 4173 --strictPort', url: DEMO_URL, reuseExistingServer: false, timeout: 120_000, env: { PUBLIC_DEMO_MODE: 'true' } },
		{ command: 'npx vite preview --port 4174 --strictPort', url: NO_DEMO_URL, reuseExistingServer: false, timeout: 120_000, env: { PUBLIC_DEMO_MODE: 'false', AI_TIER: 'paid' } }
	],
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'webkit', use: { ...devices['Desktop Safari'] } },
		// student pages on a phone (CLAUDE.md: 390 × 844 in WebKit)
		{ name: 'iphone', use: { ...devices['iPhone 13'] }, grep: /@student/ }
	]
});
