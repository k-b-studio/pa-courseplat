/** Browser client, used only to upload a syllabus file with the user's own session (spec 05 R12). */
import { createBrowserClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { appPath } from '$lib/paths';

let client: ReturnType<typeof createBrowserClient> | null = null;
// same cookie path as the server client (hooks.server.ts), so a refreshed session never lands at "/"
export const browserClient = () =>
	(client ??= createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, { cookieOptions: { path: appPath('/') } }));

/** Downscale a photo to a 2,000 px long edge before upload (spec 05 R11). */
export async function downscale(file: File, max = 2000): Promise<Blob> {
	let bitmap: ImageBitmap;
	try {
		bitmap = await createImageBitmap(file);
	} catch {
		return file; // undecodable here (e.g. an unusual format): send the original, the server decides
	}
	const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
	if (scale === 1 && file.size < 4_000_000) return file;
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	return new Promise((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', 0.85));
}
