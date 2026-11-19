<script lang="ts">
	import { appPath } from '$lib/paths';
	import { goto } from '$app/navigation';
	import { t } from '$lib/i18n/th';
	import { browserClient, downscale } from '$lib/supabase-browser';
	import { onDestroy, untrack } from 'svelte';

	let { data } = $props();
	let tab = $state<'file' | 'text'>(untrack(() => data.tab as 'file' | 'text'));
	let file = $state<File | null>(null);
	let text = $state('');
	let step = $state(-1); // index into t.importAi.steps while running
	let elapsed = $state(0);
	let message = $state<string | null>(null);
	let manual = $state(false);
	let timer: ReturnType<typeof setInterval> | undefined;
	onDestroy(() => clearInterval(timer));

	const MAX = 15 * 1024 * 1024;
	const EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx' };

	function pick(e: Event) {
		message = null;
		manual = false;
		const f = (e.currentTarget as HTMLInputElement).files?.[0] ?? null;
		if (f && /\.doc$/i.test(f.name)) return ((file = null), (message = t.importAi.docRefused));
		if (f && f.size > MAX) return ((file = null), (message = t.importAi.tooLarge));
		file = f;
	}

	async function run() {
		message = null;
		manual = false;
		if (tab === 'text' && !text.trim()) return (message = t.importAi.textEmpty);
		if (tab === 'text' && text.length > 60_000) return (message = t.importAi.textTooLong);
		if (tab === 'file' && !file) return;
		step = 0;
		elapsed = 0;
		const started = Date.now();
		timer = setInterval(() => {
			elapsed = Math.round((Date.now() - started) / 1000);
			if (step === 1 && elapsed > 12) step = 2; // honest but coarse: the server reports only the end
		}, 500);
		try {
			let body: Record<string, string> = { offeringId: data.offering.id };
			if (tab === 'file' && file) {
				const isImage = file.type.startsWith('image/');
				const blob = isImage ? await downscale(file) : file;
				const docxMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
				const type = isImage ? blob.type || 'image/jpeg' : file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : docxMime);
				const ext = EXT[type] ?? (/\.pdf$/i.test(file.name) ? 'pdf' : 'docx');
				const path = `${data.offering.id}/${crypto.randomUUID()}.${ext}`;
				const { error } = await browserClient().storage.from('syllabus-uploads').upload(path, blob, { contentType: type, upsert: false });
				if (error) throw Object.assign(new Error(t.importAi.uploadFailed), { manual: false });
				body = { ...body, storagePath: path };
			} else body = { ...body, text };
			step = 1;
			const res = await fetch(appPath('/api/extract'), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
			const out = await res.json().catch(() => ({}));
			if (!res.ok) throw Object.assign(new Error(out.message ?? t.importAi.failed), { manual: !!out.manual });
			step = 3;
			await goto(appPath(`/teach/${data.offering.id}/review/${out.extractionId}`));
		} catch (e) {
			message = e instanceof Error ? e.message : t.importAi.failed;
			manual = !!(e as { manual?: boolean }).manual;
			step = -1;
		} finally {
			clearInterval(timer);
		}
	}
</script>

<p class="text-sm text-ink-muted"><a href={appPath('/teach')} class="underline">{t.nav.teach}</a> / <a href={appPath(`/teach/${data.offering.id}/edit`)} class="underline">{data.offering.course_code}</a></p>
<h1 class="mt-1 text-2xl font-semibold">{t.importAi.title}</h1>
<p class="text-ink-muted">{data.offering.course_code} {data.offering.course.name_th} · {data.offering.semester.label}</p>

{#if data.offline}<p class="mt-4 rounded-lg border border-info/30 bg-info-bg px-4 py-2 text-sm text-info" data-testid="offline-banner">{t.importAi.offlineBanner}</p>{/if}
{#if data.freeTier}<p class="mt-4 rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-warning-ink" data-testid="data-notice">{t.importAi.dataNotice}</p>{/if}

<section class="card mt-4 max-w-2xl p-5">
	<div class="flex gap-2" role="tablist">
		<button type="button" role="tab" aria-selected={tab === 'file'} class="btn {tab === 'file' ? 'btn-primary' : 'btn-secondary'} text-sm" onclick={() => (tab = 'file')}>{t.importAi.fileTab}</button>
		<button type="button" role="tab" aria-selected={tab === 'text'} class="btn {tab === 'text' ? 'btn-primary' : 'btn-secondary'} text-sm" onclick={() => (tab = 'text')} data-testid="tab-text">{t.importAi.textTab}</button>
	</div>

	{#if tab === 'file'}
		<label class="mt-4 grid gap-2">
			<span class="text-sm text-ink-muted">{t.importAi.dropHint}</span>
			<input type="file" accept=".docx,.pdf,.png,.jpg,.jpeg,.webp,.doc" onchange={pick} disabled={step >= 0} data-testid="file-input" />
		</label>
	{:else}
		<label class="mt-4 grid gap-1">
			<span class="text-sm text-ink-muted">{t.importAi.textHint}</span>
			<textarea class="input" rows="10" bind:value={text} maxlength="60000" disabled={step >= 0} data-testid="text-input"></textarea>
		</label>
	{/if}

	<button type="button" class="btn btn-primary mt-4" onclick={run} disabled={step >= 0 || (tab === 'file' ? !file : !text.trim())} data-testid="start-import">{t.importAi.start}</button>

	{#if step >= 0}
		<ol class="mt-5 grid gap-2" aria-live="polite" data-testid="progress">
			{#each t.importAi.steps as label, i (label)}
				<li class="flex items-center gap-2 text-sm {i < step ? 'text-success' : i === step ? 'font-semibold' : 'text-ink-muted'}">
					<span aria-hidden="true">{i < step ? '✓' : i === step ? '…' : '○'}</span>{label}
				</li>
			{/each}
		</ol>
		<p class="mt-2 text-xs text-ink-muted">{t.importAi.elapsed(elapsed)} · {t.importAi.canLeave}</p>
	{/if}

	{#if message}
		<div class="mt-4 rounded-lg bg-danger-bg px-4 py-3 text-sm text-danger-ink" role="alert" data-testid="import-error">
			<p>{message}</p>
			{#if manual}<a class="btn btn-secondary mt-3 text-sm" href={appPath(`/teach/${data.offering.id}/edit`)} data-testid="manual-form">{t.importAi.manualForm}</a>{/if}
		</div>
	{/if}
</section>
