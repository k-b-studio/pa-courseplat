/** postgres.js connection for scripts (never used by the running app). */
import postgres from 'postgres';

export function dbUrl(): string {
	const url = process.env.SUPABASE_DB_URL;
	if (!url) {
		console.error('SUPABASE_DB_URL is not set (.env). See .env.example.');
		process.exit(2);
	}
	return url;
}

/** host:port/db without credentials, for logs */
export function describeUrl(url: string): string {
	try {
		const u = new URL(url);
		return `${u.hostname}:${u.port || 5432}${u.pathname}`;
	} catch {
		return '(unparseable URL)';
	}
}

export function isLocal(url: string): boolean {
	try {
		return ['localhost', '127.0.0.1', '::1'].includes(new URL(url).hostname);
	} catch {
		return false;
	}
}

export function connect(url = dbUrl()) {
	return postgres(url, { prepare: false, max: 1, onnotice: () => {}, connect_timeout: 20 });
}
