/**
 * The site that proxies this app (kbstudio-pages rewrites kbstudio.space/pa-courseplat/* here).
 * Behind the rewrite the app sees its own vercel.app host in `url.origin`, so anything that sends the
 * browser to an absolute URL (the OAuth return address) uses the Origin the browser really used,
 * when it is one of these. Keep in step with `csrf.trustedOrigins` in svelte.config.js.
 */
export const PORTAL_ORIGINS = ['https://kbstudio.space'];

/** the origin the browser is on: the portal when the request came through it, otherwise our own */
export function browserOrigin(request: Request, url: URL): string {
	const origin = request.headers.get('origin');
	return origin && PORTAL_ORIGINS.includes(origin) ? origin : url.origin;
}
