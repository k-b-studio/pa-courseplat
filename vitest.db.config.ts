import { defineConfig } from 'vitest/config';

// Database tests run against a real Supabase project (local stack or the shared one).
// They need .env loaded: `npm run test:db`.
export default defineConfig({
	test: {
		include: ['tests/db/**/*.test.ts'],
		environment: 'node',
		testTimeout: 60_000,
		hookTimeout: 120_000,
		fileParallelism: false,
		setupFiles: ['tests/db/setup-env.ts']
	}
});
