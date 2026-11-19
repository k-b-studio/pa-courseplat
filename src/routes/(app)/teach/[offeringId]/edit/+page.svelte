<script lang="ts">
	import { deserialize, enhance } from '$app/forms';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import Drawer from '$lib/components/caution/Drawer.svelte';
	import DiffList from '$lib/components/editor/DiffList.svelte';
	import ReadinessPanel from '$lib/components/editor/ReadinessPanel.svelte';
	import SectionDetails from '$lib/components/editor/SectionDetails.svelte';
	import SyllabusForm from '$lib/components/editor/SyllabusForm.svelte';
	import { cardFor } from '$lib/components/editor/types';
	import SyllabusView from '$lib/components/syllabus/SyllabusView.svelte';
	import { changedSections } from '$lib/domain/diff';
	import { personName, t, thaiDate, thaiDateTime, thaiTime } from '$lib/i18n/th';
	import { strictIssues, type SyllabusDoc } from '$lib/schema/syllabus';
	import { onMount, untrack } from 'svelte';

	let { data } = $props();

	// the editor works on its own copy; adopt() takes the server's copy after clone/blank actions
	const initial = untrack(() => ({ doc: data.doc, revision: data.offering.revision, flags: data.flags }));
	let doc = $state<SyllabusDoc | null>(initial.doc ? structuredClone(initial.doc) : null);
	let revision = $state(initial.revision);
	let lastSaved = $state(initial.doc ? JSON.stringify(initial.doc) : '');
	let status = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');
	let savedAt = $state<string | null>(null);
	let message = $state<string | null>(null);
	let conflict = $state<{ serverRevision: number; serverDoc: SyllabusDoc } | null>(null);
	let aiPlo = $state<string[]>([...initial.flags.aiPlo]);
	let aiWeeks = $state<number[]>([...initial.flags.aiWeeks]);
	let preview = $state(false);
	let busy = $state(false);
	let tab = $state<'notes' | 'history' | 'cautions'>('notes');
	let diffWith = $state<string | null>(null);
	let selectedCaution = $state<string | null>(null);
	let runState = $state<'idle' | 'running' | 'done' | 'failed'>('idle');
	let runFound = $state(0);
	const currentCaution = $derived(data.cautions.find((c) => c.id === selectedCaution) ?? null);
	const openCautions = $derived(data.cautions.filter((c) => c.status === 'open' || c.status === 'coordinating'));
	// spec 06 "Editor markers": open high/medium cautions per item of this offering
	const markers = $derived.by(() => {
		const out: Record<string, { count: number; worst: 'high' | 'medium'; id: string }> = {};
		for (const c of openCautions) {
			if (c.severity === 'info') continue;
			const ref = c.a_offering_id === data.offering.id ? c.a_ref : c.b_offering_id === data.offering.id ? c.b_ref : null;
			if (!ref) continue;
			const prev = out[ref];
			out[ref] = { count: (prev?.count ?? 0) + 1, worst: prev?.worst === 'high' || c.severity === 'high' ? 'high' : 'medium', id: prev?.id ?? c.id };
		}
		return out;
	});

	/** spec 06 R4: after publishing, after an accepted import, or on demand */
	async function runCheck(trigger: 'manual' | 'publish' | 'import') {
		runState = 'running';
		let ok = false;
		try {
			const res = await fetch('/api/cautions/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ offeringId: data.offering.id, trigger }) });
			const out = await res.json();
			if (!res.ok) throw new Error(out.message);
			runFound = out.produced ?? 0;
			ok = true;
		} catch {
			ok = false;
		}
		// report "done" only once the editor shows the new cautions
		await invalidateAll();
		runState = ok ? 'done' : 'failed';
	}
	onMount(async () => {
		if (page.url.searchParams.get('run') === 'import') {
			// drop ?run=import with a real navigation first, so a reload or Back never runs it twice
			await goto(page.url.pathname, { replaceState: true, noScroll: true, keepFocus: true });
			await runCheck('import');
		}
	});

	const snapshot = $derived(doc ? JSON.stringify(doc) : '');
	const dirty = $derived(!!doc && snapshot !== lastSaved);
	const issues = $derived(doc ? strictIssues(doc, data.semester.weeks || 16) : []);
	const issueCounts = $derived(issues.reduce<Record<string, number>>((acc, i) => ((acc[cardFor(i.path)] = (acc[cardFor(i.path)] ?? 0) + 1), acc), {}));
	const published = $derived(data.offering.status === 'published');
	const ctx = $derived({ course: data.course, semester: data.semester, instructors: data.instructors, plos: data.plos, suggestedPlos: data.suggestedPlos, sections: data.sections });

	/** take the server's copy after an action that replaced the document (clone, blank start) */
	function adopt() {
		doc = data.doc ? structuredClone(data.doc) : null;
		revision = data.offering.revision;
		lastSaved = data.doc ? JSON.stringify(data.doc) : '';
		aiPlo = [...data.flags.aiPlo];
		aiWeeks = [...data.flags.aiWeeks];
	}

	async function post(action: string, fields: Record<string, string>) {
		const fd = new FormData();
		for (const [k, v] of Object.entries(fields)) fd.set(k, v);
		const res = await fetch(`?/${action}`, { method: 'POST', body: fd, headers: { 'x-sveltekit-action': 'true' } });
		return deserialize(await res.text());
	}

	// autosave (spec 05 R5): 1.5 s after the last change, with the revision this editor started from
	async function save(body: string, expected = revision) {
		status = 'saving';
		const r = await post('save', { doc: body, revision: String(expected) });
		if (r.type === 'success') {
			revision = (r.data as { revision: number }).revision;
			lastSaved = body;
			savedAt = (r.data as { savedAt: string }).savedAt;
			status = 'saved';
			message = null;
		} else if (r.type === 'failure' && r.status === 409) {
			conflict = r.data as { serverRevision: number; serverDoc: SyllabusDoc };
			status = 'idle';
		} else {
			status = 'error';
			message = (r.type === 'failure' && (r.data as { message?: string })?.message) || t.editor.saveFailed;
		}
	}
	$effect(() => {
		const body = snapshot;
		if (!doc || body === lastSaved || conflict || status === 'saving') return;
		const timer = setTimeout(() => save(body), 1500);
		return () => clearTimeout(timer);
	});

	function loadLatest() {
		if (!conflict) return;
		// conflict is reactive state: take a plain copy (structuredClone throws on proxies)
		const server = $state.snapshot(conflict.serverDoc) as SyllabusDoc;
		doc = server;
		revision = conflict.serverRevision;
		lastSaved = JSON.stringify(server);
		conflict = null;
	}
	async function overwrite() {
		if (!conflict || !confirm(t.editor.overwriteConfirm)) return;
		const rev = conflict.serverRevision;
		conflict = null;
		await save(snapshot, rev);
	}

	async function publish() {
		busy = true;
		const r = await post('publish', { revision: String(revision) });
		busy = false;
		if (r.type === 'success') {
			message = null;
			await invalidateAll();
			runCheck('publish');
		} else if (r.type === 'failure' && r.status === 409) conflict = r.data as { serverRevision: number; serverDoc: SyllabusDoc };
		else message = (r.type === 'failure' && (r.data as { message?: string })?.message) || t.editor.publishFailed;
	}

	const sectionLabel: Record<string, string> = {
		overview: t.sections.overview.th,
		objectives: t.sections.objectives.th,
		approach: t.sections.approach.th,
		weeklyPlan: t.sections.timetable.th,
		evaluation: t.sections.evaluation.th,
		resources: t.sections.resources.th,
		work: t.sections.work.th,
		keyDates: t.editor.keyDates
	};
	const replaced = () => async ({ result }: { result: { type: string } }) => {
		if (result.type === 'success') {
			await invalidateAll();
			adopt();
		}
	};
</script>

{#snippet sidebar()}
	<div class="card min-w-0 p-4 wrap-anywhere">
		<div class="grid grid-cols-3 gap-1 rounded-xl bg-page p-1" role="tablist">
			{#each [['notes', t.editor.sidebar.notes, t.editor.sidebar.notes], ['history', t.editor.sidebar.history, t.editor.sidebar.history], ['cautions', t.editor.sidebar.cautionsShort, t.editor.sidebar.cautions]] as const as [id, label, full] (id)}
				<button
					type="button"
					role="tab"
					aria-selected={tab === id}
					aria-label={id === 'cautions' && openCautions.length ? `${full} ${openCautions.length}` : full}
					title={full}
					class="flex min-w-0 items-center justify-center gap-1 rounded-lg px-1.5 py-1.5 text-center text-xs leading-tight transition-colors {tab === id ? 'bg-surface font-semibold text-brand-800 shadow-sm' : 'text-ink-muted hover:text-ink'}"
					onclick={() => (tab = id)}
					data-testid="tab-{id}"
					><span class="min-w-0">{label}</span>{#if id === 'cautions' && openCautions.length}<span class="shrink-0 rounded-full bg-danger px-1.5 text-[0.7rem] leading-4 font-semibold text-white">{openCautions.length}</span>{/if}</button
				>
			{/each}
		</div>

		{#if tab === 'notes'}
			<ul class="mt-3 grid max-h-80 gap-3 overflow-y-auto" data-testid="notes">
				{#each data.notes as n (n.id)}
					<li class="text-sm">
						<p class="text-xs text-ink-muted">{personName(n.author) || t.common.deletedUser} · {n.semester} · {thaiDate(n.created_at)}{#if n.isNew} <span class="chip bg-warning-bg text-warning-ink">{t.editor.newNote}</span>{/if}</p>
						<p class="mt-0.5 whitespace-pre-line">{n.body}</p>
					</li>
				{:else}<li class="text-sm text-ink-muted">{t.editor.noNotes}</li>{/each}
			</ul>
			<form method="POST" action="?/addNote" class="mt-3 grid gap-2" use:enhance={() => async ({ update }) => update({ invalidateAll: true })}>
				<textarea class="input text-sm" name="body" rows="3" maxlength="4000" placeholder={t.editor.notePlaceholder} required></textarea>
				<button class="btn btn-secondary text-sm" type="submit">{t.editor.addNote}</button>
			</form>
		{:else if tab === 'history'}
			<ul class="mt-3 grid gap-3" data-testid="history">
				{#each data.history as h (h.versionId)}
					<li class="text-sm">
						<p class="font-medium">{h.label}</p>
						<div class="mt-1 flex flex-wrap gap-2">
							<button type="button" class="btn btn-ghost px-2 text-xs" onclick={() => (diffWith = diffWith === h.versionId ? null : h.versionId)} data-testid="compare-version">{t.editor.compareWith}</button>
							<form method="POST" action="?/clone" use:enhance={({ cancel }) => { if (!confirm(t.editor.copyConfirm)) cancel(); return replaced(); }}>
								<input type="hidden" name="versionId" value={h.versionId} />
								<button class="btn btn-ghost px-2 text-xs" type="submit">{t.editor.copyAsDraft}</button>
							</form>
						</div>
						{#if diffWith === h.versionId}
							<div class="mt-2 rounded-lg bg-page p-3">
								<p class="mb-2 text-xs font-semibold">{t.editor.diffTitle(h.label)}</p>
								{#if doc}<DiffList from={h.doc} to={doc} />{/if}
							</div>
						{/if}
					</li>
				{:else}<li class="text-sm text-ink-muted">{t.editor.noHistory}</li>{/each}
			</ul>
		{:else}
			{#if data.lastRun?.status === 'failed'}<p class="mt-3 rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning-ink" data-testid="ai-failed">{t.cautions.aiFailed}</p>{/if}
			{#if openCautions.length}
				<ul class="mt-3 grid gap-2" data-testid="editor-cautions">
					{#each openCautions as c (c.id)}
						<li>
							<button type="button" class="block w-full min-w-0 rounded-lg border border-line p-2 text-left text-sm hover:border-accent" onclick={() => (selectedCaution = c.id)} data-severity={c.severity}>
								<span class="chip text-xs {c.severity === 'high' ? 'bg-danger-bg text-danger-ink' : c.severity === 'medium' ? 'bg-warning-bg text-warning-ink' : ''}">{t.cautions.severity[c.severity]}</span>
								<span class="mt-1 block">{(c.a_offering_id === data.offering.id ? c.b_label : c.a_label).split(':')[0]}</span>
								<!-- wraps (up to three lines) instead of a nowrap line whose width would size the sidebar -->
								<span class="mt-0.5 line-clamp-3 text-xs text-ink-muted" data-testid="editor-caution-reason">{c.reason_th}</span>
							</button>
						</li>
					{/each}
				</ul>
			{:else}<p class="mt-3 text-sm text-ink-muted">{t.editor.noCautions}</p>{/if}
			<div class="mt-3 flex flex-wrap items-center gap-2">
				{#if doc}<button type="button" class="btn btn-secondary px-2 text-xs" onclick={() => runCheck('manual')} disabled={runState === 'running' || dirty} data-testid="run-check">{t.cautions.runCheck}</button>{/if}
				<a class="text-sm text-accent underline" href="/cautions?offering={data.offering.id}">{t.editor.allCautions}</a>
			</div>
		{/if}
	</div>
{/snippet}

<svelte:head><title>{data.course.code} · {t.nav.teach}</title></svelte:head>

<div class="pb-24 lg:pb-0">
	<p class="text-sm text-ink-muted"><a href="/teach" class="underline">{t.nav.teach}</a> / {data.course.code} · {data.semester.label}</p>
	<div class="mt-1 flex flex-wrap items-center gap-3">
		<h1 class="text-2xl font-semibold" data-testid="editor-title">{data.course.code} {data.course.name_th}</h1>
		<span class="chip" data-testid="offering-status">{t.offeringStatus[data.offering.status]}</span>
	</div>

	{#if !doc}
		<div class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
		<!-- R2: four ways to start -->
		<section class="grid gap-3 sm:grid-cols-2" aria-label={t.editor.startTitle} data-testid="start-options">
			<a class="card block p-5 hover:border-accent" href="/teach/{data.offering.id}/import"><p class="font-semibold">{t.editor.startUpload}</p><p class="text-sm text-ink-muted">{t.editor.startUploadHint}</p></a>
			<a class="card block p-5 hover:border-accent" href="/teach/{data.offering.id}/import?tab=text"><p class="font-semibold">{t.editor.startPaste}</p></a>
			<div class="card p-5">
				<p class="font-semibold">{t.editor.startCopy}</p>
				{#if data.history.length}
					<ul class="mt-2 grid gap-2">
						{#each data.history as h (h.versionId)}
							<li>
								<form method="POST" action="?/clone" use:enhance={replaced}>
									<input type="hidden" name="versionId" value={h.versionId} />
									<button class="btn btn-secondary w-full text-sm" type="submit" data-testid="copy-version" data-label={h.label}>{h.label}</button>
								</form>
							</li>
						{/each}
					</ul>
				{:else}<p class="mt-1 text-sm text-ink-muted">{t.editor.startCopyNone}</p>{/if}
			</div>
			<form class="card p-5" method="POST" action="?/blank" use:enhance={replaced}>
				<button class="w-full text-left" type="submit" data-testid="start-blank"><span class="font-semibold">{t.editor.startBlank}</span></button>
			</form>
		</section>
		<aside class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4">{@render sidebar()}</aside>
		</div>
	{:else}
		<div class="sticky top-0 z-20 -mx-4 mt-3 flex flex-wrap items-center gap-3 border-b border-line bg-page/95 px-4 py-2 backdrop-blur">
			<span class="text-sm {status === 'error' ? 'text-danger-ink' : 'text-ink-muted'}" data-testid="save-status" aria-live="polite">
				{#if status === 'saving'}{t.editor.saving}{:else if status === 'error'}{message}{:else if dirty}{t.editor.unsaved}{:else if savedAt}{t.editor.saved(thaiTime(savedAt))}{/if}
			</span>
			{#if runState === 'running'}<span class="text-sm text-info" data-testid="run-status">{t.cautions.running}</span>{:else if runState === 'done'}<span class="text-sm text-ink-muted" data-testid="run-status">{t.cautions.runDone(runFound)}</span>{:else if runState === 'failed'}<span class="text-sm text-danger-ink" data-testid="run-status">{t.cautions.runFailed}</span>{/if}
			<button type="button" class="btn btn-secondary ml-auto text-sm" aria-pressed={preview} onclick={() => (preview = !preview)} data-testid="preview-toggle">{preview ? t.editor.backToForm : t.editor.preview}</button>
			{#if published}
				<form method="POST" action="?/unpublish" use:enhance={() => async ({ update }) => update()}><button class="btn btn-ghost text-sm" type="submit">{t.editor.unpublish}</button></form>
			{/if}
		</div>
		{#if message && status !== 'error'}<p class="mt-3 rounded-lg bg-danger-bg px-4 py-2 text-sm text-danger-ink" role="alert">{message}</p>{/if}

		<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
			<div class="min-w-0">
				{#if preview}
					<SyllabusView ctx={{ doc, course: data.course, semester: data.semester, sections: data.sections, instructors: data.instructors, plos: data.plos }} />
				{:else}
					<SyllabusForm bind:doc {ctx} issues={issueCounts} bind:aiPlo bind:aiWeeks {markers} onmarker={(id) => (selectedCaution = id)}>
						{#snippet sectionsSlot()}
							{#each data.sections as s (s.id)}<SectionDetails section={s} editable={data.mySectionIds.includes(s.id) || data.profile.role === 'staff'} />{/each}
						{/snippet}
					</SyllabusForm>
				{/if}
			</div>

			<aside class="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-4 lg:sticky lg:top-16">
				<ReadinessPanel {issues} onpublish={publish} {busy} {published} {dirty} />

				{@render sidebar()}
				{#if data.offering.updated_at}<p class="text-xs text-ink-muted">{t.editor.lastEdited} {thaiDateTime(data.offering.updated_at)}</p>{/if}
			</aside>
		</div>
	{/if}
</div>

{#if conflict}
	<div class="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="conflict-title" data-testid="conflict-dialog">
		<div class="card w-full max-w-md p-5">
			<h2 id="conflict-title" class="text-lg font-semibold">{t.editor.conflictTitle}</h2>
			<p class="mt-2 text-sm">{t.editor.conflictLead}</p>
			<ul class="mt-1 list-disc pl-5 text-sm">
				{#each doc ? changedSections(conflict.serverDoc, doc) : [] as k (k)}<li>{sectionLabel[k]}</li>{/each}
			</ul>
			<div class="mt-4 flex flex-wrap justify-end gap-2">
				<button type="button" class="btn btn-secondary" onclick={loadLatest} data-testid="load-latest">{t.editor.loadLatest}</button>
				<button type="button" class="btn btn-danger" onclick={overwrite} data-testid="overwrite">{t.editor.overwrite}</button>
			</div>
		</div>
	</div>
{/if}

{#if currentCaution}<Drawer c={currentCaution} mine={[data.offering.id]} onclose={() => (selectedCaution = null)} />{/if}
