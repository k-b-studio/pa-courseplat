/**
 * POST /api/extract { offeringId, storagePath | text } (spec 05 R12, pipeline diagram).
 * Checks can_edit_offering with the user's JWT before touching the file; storage policies enforce
 * the same rule. The extraction row always ends succeeded or failed (AC 12: nothing stays running).
 */
import { error, json } from '@sveltejs/kit';
import { PDFDocument } from 'pdf-lib';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { t } from '$lib/i18n/th';
import { aiConfigFrom } from '$lib/server/ai/config';
import { extract, postProcess, quotaMessage, type ExtractCtx, type ExtractInput } from '$lib/server/ai/extract';
import { OFFLINE_DELAY_MS, offlineForFile, offlineForText, sha256, wait } from '$lib/server/ai/offline';
import { AiError } from '$lib/server/ai/types';
import { callsLastHour, logCalls } from '$lib/server/ai-calls';
import { instructorsFor, plosMap } from '$lib/server/course-page';
import { docxToText } from '$lib/server/docx';
import { sniff } from '$lib/server/sniff';
import { sectionsFor } from '$lib/server/student';
import type { RequestHandler } from './$types';

export const config = { maxDuration: 120 };

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const Body = z.object({ offeringId: z.string().regex(new RegExp(`^${UUID}$`, 'i')), storagePath: z.string().max(200).optional(), text: z.string().max(60_000).optional() });

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user || !locals.profile) error(401, t.auth.genericError);
	const body = Body.safeParse(await request.json().catch(() => null));
	if (!body.success || (!body.data.storagePath && !body.data.text?.trim())) return json({ message: t.editor.invalid }, { status: 400 });
	const { offeringId, storagePath, text } = body.data;
	const sb = locals.supabase;

	const { data: allowed } = await sb.rpc('can_edit_offering', { p_offering: offeringId });
	if (!allowed) return json({ message: t.auth.forbidden }, { status: 403 });
	if (storagePath && !new RegExp(`^${offeringId}/${UUID}\\.(docx|pdf|png|jpe?g|webp)$`, 'i').test(storagePath)) return json({ message: t.editor.invalid }, { status: 400 });

	const cfg = aiConfigFrom(env);
	if (!cfg.offline && (await callsLastHour(user.id)) >= cfg.maxCallsPerHour) return json({ message: t.importAi.rateLimited(cfg.maxCallsPerHour), manual: true }, { status: 429 });

	// read the input as the user (storage policies apply)
	let input: ExtractInput;
	let bytes: Uint8Array | null = null;
	if (storagePath) {
		const { data: blob, error: e } = await sb.storage.from('syllabus-uploads').download(storagePath);
		if (e || !blob) return json({ message: t.importAi.uploadFailed }, { status: 404 });
		bytes = new Uint8Array(await blob.arrayBuffer());
		const kind = sniff(bytes);
		if (kind?.kind === 'doc') return json({ message: t.importAi.docRefused }, { status: 415 });
		if (!kind) return json({ message: t.importAi.unsupported }, { status: 415 });
		if (kind.kind === 'pdf') {
			const pages = await PDFDocument.load(bytes, { ignoreEncryption: true }).then((d) => d.getPageCount()).catch(() => 0);
			if (pages > 30) return json({ message: t.importAi.tooManyPages }, { status: 413 });
		}
		input = kind.kind === 'docx' ? { kind: 'docx', text: await docxToText(bytes) } : { kind: kind.kind, mime: kind.mime, data: Buffer.from(bytes).toString('base64') };
	} else input = { kind: 'text', text: text! };

	const { data: row, error: insErr } = await sb
		.from('extractions')
		.insert({ offering_id: offeringId, created_by: user.id, source_kind: input.kind, storage_path: storagePath ?? null, file_sha256: bytes ? sha256(bytes) : sha256(text!), status: 'running', offline: cfg.offline })
		.select('id')
		.single();
	if (insErr || !row) return json({ message: t.importAi.failed }, { status: 500 });
	const finish = (patch: Record<string, unknown>) => sb.from('extractions').update({ ...patch, finished_at: new Date().toISOString() }).eq('id', row.id);

	try {
		const ctx = await contextFor(sb, offeringId);
		const sourceText = input.kind === 'text' ? input.text : undefined;
		if (cfg.offline) {
			const fixture = bytes ? offlineForFile(bytes) : offlineForText(text!);
			await wait(OFFLINE_DELAY_MS);
			await logCalls(user.id)({ provider: 'gemini', kind: 'extract', model: 'offline-fixture', modelVersion: null, status: 'offline', httpStatus: null, inputTokens: null, outputTokens: null, latencyMs: OFFLINE_DELAY_MS });
			if (!fixture) {
				await finish({ status: 'failed', error: 'offline_no_fixture' });
				return json({ message: t.importAi.offlineMissing, offline: true, manual: true }, { status: 503 });
			}
			await finish({ status: 'succeeded', result: { ...postProcess(fixture, ctx, input), sourceText }, model: 'offline-fixture' });
			return json({ extractionId: row.id, offline: true });
		}
		const out = await extract(cfg, input, ctx, logCalls(user.id));
		await finish({ status: 'succeeded', result: { ...out.result, sourceText }, model: `${out.provider}:${out.model}`, input_tokens: out.usage.input, output_tokens: out.usage.output });
		return json({ extractionId: row.id, offline: false, fallback: out.fallback });
	} catch (e) {
		const code = e instanceof AiError ? e.code : 'error';
		await finish({ status: 'failed', error: code });
		if (code === 'quota') return json({ message: quotaMessage(), manual: true }, { status: 429 });
		if (code === 'max_tokens') return json({ message: t.importAi.tooLong, manual: true }, { status: 422 });
		return json({ message: t.importAi.failed, manual: true }, { status: 502 });
	}
};

async function contextFor(sb: App.Locals['supabase'], offeringId: string): Promise<ExtractCtx> {
	const { data: off } = await sb.from('offerings').select('course:courses(code, name_th, name_en, credit_format), semester:semesters(label, weeks)').eq('id', offeringId).single();
	const sections = (await sectionsFor(sb, [offeringId])).get(offeringId) ?? [];
	const [instructors, plos] = await Promise.all([instructorsFor(sb, sections), plosMap(sb)]);
	const o = off as unknown as { course: ExtractCtx['course']; semester: { label: string; weeks: number } };
	return {
		course: { ...o.course, code: o.course.code.trim() },
		semesterLabel: o.semester.label,
		weeks: o.semester.weeks || 16,
		instructors: instructors.filter((p) => p.id).map((p) => ({ id: p.id!, title_th: p.title_th, name_th: p.name_th, name_en: p.name_en })),
		plos: Object.entries(plos).map(([code, text]) => ({ code, text }))
	};
}
