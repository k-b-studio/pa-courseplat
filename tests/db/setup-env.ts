import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
for (const k of ['PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'SUPABASE_DB_URL', 'DEMO_ACCOUNT_PASSWORD'])
	if (!process.env[k]) throw new Error(`${k} missing: tests/db run against a real project and need .env`);
