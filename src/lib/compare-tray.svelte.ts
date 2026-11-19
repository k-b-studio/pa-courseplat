/**
 * The compare tray (spec 04 R1/R3): up to three offerings, kept in localStorage (non-goal: saving
 * baskets on the server). Storage can be unavailable (private mode), so every access is guarded.
 */
export type TrayItem = { id: string; code: string; name: string };
export const TRAY_MAX = 3;
const KEY = 'cp_compare';

export const tray = $state<{ items: TrayItem[]; ready: boolean }>({ items: [], ready: false });

export function initTray() {
	if (tray.ready) return;
	try {
		const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
		if (Array.isArray(raw)) tray.items = raw.filter((x) => x && typeof x.id === 'string').slice(0, TRAY_MAX);
	} catch {
		/* storage unavailable: the tray just starts empty */
	}
	tray.ready = true;
}

function persist() {
	try {
		localStorage.setItem(KEY, JSON.stringify(tray.items));
	} catch {
		/* ignore */
	}
}

export const inTray = (id: string) => tray.items.some((x) => x.id === id);

export function toggleTray(item: TrayItem) {
	if (inTray(item.id)) tray.items = tray.items.filter((x) => x.id !== item.id);
	else if (tray.items.length < TRAY_MAX) tray.items = [...tray.items, item];
	persist();
}

export function clearTray() {
	tray.items = [];
	persist();
}

export const compareHref = (ids: string[]) => `/compare?o=${ids.join(',')}`;
