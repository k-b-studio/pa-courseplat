import { resolve } from '$app/paths';
import type { Pathname } from '$app/types';

/**
 * An in-app URL, for links, redirects, goto and fetch. The app lives under a base path
 * (kbstudio.space/pa-courseplat, svelte.config.js) and every page and endpoint ends in "/":
 * kbstudio.space adds a trailing slash to every path, so the app must want one too, or the two
 * redirects loop. Write the path as it appears in the route tree, with or without the slash:
 * appPath('/courses'), appPath(`/teach/${id}/edit?run=import`).
 */
export function appPath(path: string): string {
	if (!path.startsWith('/')) throw new Error(`appPath needs an absolute in-app path, got "${path}"`);
	const cut = path.search(/[?#]/);
	const pathname = cut < 0 ? path : path.slice(0, cut);
	const rest = cut < 0 ? '' : path.slice(cut);
	return resolve((pathname.endsWith('/') ? pathname : `${pathname}/`) as Pathname) + rest;
}
