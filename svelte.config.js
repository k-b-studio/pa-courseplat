import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	compilerOptions: { runes: true },
	kit: {
		adapter: adapter({ regions: ['bom1'] }),
		// Served at kbstudio.space/pa-courseplat through a rewrite in kbstudio-pages (DECISIONS.md, deploy).
		// Build every in-app URL with appPath() from $lib/paths; absolute paths so redirects behave the same
		// behind the proxy and on the app's own vercel.app host.
		paths: { base: '/pa-courseplat', relative: false },
		// Through the kbstudio.space rewrite the browser's Origin is kbstudio.space while the app sees its own
		// vercel.app host, so SvelteKit's cross-site form check must trust it. Keep in step with PORTAL_ORIGINS
		// in src/lib/server/portal.ts. Session cookies are SameSite=Lax, so other sites' POSTs carry no session.
		csrf: { trustedOrigins: ['https://kbstudio.space'] }
	}
};

export default config;
