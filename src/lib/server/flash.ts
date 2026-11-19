/** One-shot Thai toast carried across a redirect in a short-lived cookie (spec 03: "redirect with a Thai toast"). */
import type { Cookies } from '@sveltejs/kit';
import { appPath } from '$lib/paths';

export const FLASH_KEYS = ['wrongRole', 'staffOnly', 'signedOut', 'saved'] as const;
export type FlashKey = (typeof FLASH_KEYS)[number];

const NAME = 'cp_flash';

export function setFlash(cookies: Cookies, key: FlashKey) {
	cookies.set(NAME, key, { path: appPath('/'), maxAge: 60, httpOnly: true, sameSite: 'lax' });
}

/** Read and clear. Unknown values are ignored, so the cookie can never inject text. */
export function takeFlash(cookies: Cookies): FlashKey | null {
	const v = cookies.get(NAME);
	if (!v) return null;
	cookies.delete(NAME, { path: appPath('/') });
	return (FLASH_KEYS as readonly string[]).includes(v) ? (v as FlashKey) : null;
}
