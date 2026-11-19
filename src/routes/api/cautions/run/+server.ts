/** POST /api/cautions/run { offeringId, trigger } — spec 06 R4: after publish, after an accepted import, or on demand. */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { t } from '$lib/i18n/th';
import { aiConfigFrom } from '$lib/server/ai/config';
import { logCalls } from '$lib/server/ai-calls';
import { cautionFixture } from '$lib/server/cautions/fixtures';
import { runCautions } from '$lib/server/cautions/run';
import { adminClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

// every path ends in "/" (see $lib/paths)
export const trailingSlash = 'always';

const Body = z.object({ offeringId: z.string().uuid(), trigger: z.enum(['manual', 'publish', 'import']).default('manual') });

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !locals.profile) return json({ message: t.auth.genericError }, { status: 401 });
	const body = Body.safeParse(await request.json().catch(() => null));
	if (!body.success) return json({ message: t.editor.invalid }, { status: 400 });
	// the permission check runs in Postgres with the user's JWT before any secret-key write
	const { data: allowed } = await locals.supabase.rpc('can_edit_offering', { p_offering: body.data.offeringId });
	if (!allowed) return json({ message: t.auth.forbidden }, { status: 403 });
	try {
		const summary = await runCautions(adminClient(), { offeringId: body.data.offeringId, userId: locals.user.id, trigger: body.data.trigger, cfg: aiConfigFrom(env) }, { fixture: cautionFixture, onCall: logCalls(locals.user.id) });
		return json(summary);
	} catch {
		return json({ message: t.cautions.runFailed }, { status: 500 });
	}
};
