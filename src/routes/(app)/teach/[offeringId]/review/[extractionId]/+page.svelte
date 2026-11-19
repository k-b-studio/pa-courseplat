<script lang="ts">
	import { enhance } from '$app/forms';
	import SyllabusForm from '$lib/components/editor/SyllabusForm.svelte';
	import type { MetaKey } from '$lib/components/editor/types';
	import { personName, t } from '$lib/i18n/th';
	import type { SyllabusDoc } from '$lib/schema/syllabus';
	import { untrack } from 'svelte';

	let { data, form } = $props();
	const init = untrack(() => (data.failed ? null : { doc: data.doc, flags: data.flags }));
	let doc = $state<SyllabusDoc | null>(init ? structuredClone(init.doc) : null);
	let aiPlo = $state<string[]>(init ? [...init.flags.aiPlo] : []);
	let aiWeeks = $state<number[]>(init ? [...init.flags.aiWeeks] : []);
	let askMode = $state(false);
	const chip: Record<string, string> = { high: 'bg-success-bg text-success', medium: 'bg-info-bg text-info', low: 'bg-warning-bg text-warning-ink', not_found: 'bg-danger-bg text-danger-ink' };
</script>

{#if data.failed}
	<div class="card p-6" role="alert">
		<h1 class="text-xl font-semibold">{t.importAi.failedRow}</h1>
		<a class="btn btn-secondary mt-4" href="/teach/{data.offeringId}/edit">{t.importAi.manualForm}</a>
	</div>
{:else if doc}
	<p class="text-sm text-ink-muted"><a href="/teach" class="underline">{t.nav.teach}</a> / <a href="/teach/{data.offeringId}/edit" class="underline">{data.course.code}</a></p>
	<h1 class="mt-1 text-2xl font-semibold">{t.importAi.reviewTitle}</h1>
	<p class="text-sm text-ink-muted">{data.course.code} {data.course.name_th} · {data.semester.label} · {t.importAi.notPublished}</p>

	{#if data.offline}<p class="mt-3 rounded-lg border border-info/30 bg-info-bg px-4 py-2 text-sm text-info" data-testid="offline-banner">{t.importAi.offlineBanner}</p>{/if}
	{#if data.fallback}<p class="mt-3 rounded-lg border border-warning/40 bg-warning-bg px-4 py-2 text-sm text-warning-ink" data-testid="fallback-banner">ประมวลผลด้วย ThaiLLM (ระบบสำรอง) — โปรดตรวจทานอย่างละเอียด</p>{/if}
	{#if data.result.warnings.length}
		<div class="mt-3 rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-warning-ink" data-testid="warnings">
			<p class="font-semibold">{t.importAi.warnings}</p>
			<ul class="list-disc pl-5">{#each data.result.warnings as w (w)}<li>{w}</li>{/each}</ul>
		</div>
	{/if}

	<div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
		<!-- left: the original -->
		<section class="card min-w-0 p-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-auto" aria-label={t.importAi.original} data-testid="original">
			<h2 class="label">{t.importAi.original}</h2>
			{#if data.source.kind === 'pdf' && data.source.url}
				<iframe class="mt-2 h-[70dvh] w-full rounded border border-line" src={data.source.url} title={t.importAi.original}></iframe>
			{:else if data.source.kind === 'image' && data.source.url}
				<img class="mt-2 w-full rounded border border-line" src={data.source.url} alt={t.importAi.original} />
			{:else if data.source.kind === 'html'}
				<!-- sanitised on the server (DOMPurify allowlist), never raw mammoth output -->
				<div class="prose-sm mt-2 grid gap-2 text-sm [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:p-1 [&_th]:border [&_th]:border-line [&_th]:p-1">{@html data.source.html}</div>
			{:else}
				<pre class="mt-2 text-sm whitespace-pre-wrap">{data.source.text}</pre>
			{/if}
		</section>

		<!-- right: the form, pre-filled -->
		<div class="grid min-w-0 gap-4">
			{#if data.result.sectionHints.length}
				<section class="card p-4" data-testid="hints">
					<h2 class="label">{t.importAi.hints}</h2>
					<ul class="mt-2 grid gap-2 text-sm">
						{#each data.result.sectionHints as h, i (i)}
							{@const target = data.sections.find((s) => s.section_no === h.sectionNo)}
							{@const canApply = !!target && (data.mySectionIds.includes(target.id) || data.profile.role === 'staff')}
							<li class="flex flex-wrap items-center gap-2">
								<span>{h.sectionNo ? t.common.sectionN(h.sectionNo) : ''} {h.weekday ? t.weekdays[h.weekday] : ''} {h.startsAt ?? ''}{h.endsAt ? `–${h.endsAt}` : ''} {h.room ?? ''} {h.instructorNames.join(', ')}</span>
								{#if canApply}
									<form method="POST" action="?/applyHint" use:enhance={() => async ({ update }) => update({ reset: false })}>
										<input type="hidden" name="hint" value={i} />
										<button class="btn btn-ghost px-2 text-xs" type="submit">{form?.hintApplied === i ? t.importAi.hintApplied : t.importAi.applyHint}</button>
									</form>
								{:else}<span class="text-xs text-ink-muted">{t.importAi.hintInfo}</span>{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<SyllabusForm bind:doc ctx={{ course: data.course, semester: data.semester, instructors: data.instructors, plos: data.plos, suggestedPlos: data.suggestedPlos, sections: data.sections }} meta={data.result.meta} bind:aiPlo bind:aiWeeks>
				{#snippet confidence(key: MetaKey)}
					{@const m = data.result.meta[key]}
					{#if m}
						<span class="chip text-xs {chip[m.confidence]}" data-testid="confidence-{key}">{t.importAi.confidence[m.confidence]}</span>
						{#if m.evidence}
							<details class="relative">
								<summary class="cursor-pointer list-none text-xs text-accent underline">{t.importAi.evidence}</summary>
								<p class="absolute z-10 mt-1 w-72 max-w-[80vw] rounded-lg border border-line bg-surface p-3 text-xs shadow-lg">{m.evidence}</p>
							</details>
						{/if}
					{/if}
				{/snippet}
				{#snippet sectionsSlot()}
					{#each data.sections as s (s.id)}<p class="text-sm">{t.common.sectionN(s.section_no)}: {s.instructors.map((p) => personName(p)).join(', ')}</p>{/each}
				{/snippet}
			</SyllabusForm>

			<form method="POST" action="?/accept" class="card sticky bottom-0 flex flex-wrap items-center gap-3 p-4" use:enhance={({ cancel }) => { if (data.hasDraft && !askMode) { askMode = true; cancel(); } }}>
				<input type="hidden" name="doc" value={JSON.stringify(doc)} />
				{#if askMode}
					<p class="w-full text-sm font-medium">{t.importAi.acceptTitle}</p>
					<button class="btn btn-primary" type="submit" name="mode" value="replace">{t.importAi.replaceAll}</button>
					<button class="btn btn-secondary" type="submit" name="mode" value="fill">{t.importAi.fillEmpty}</button>
					<button class="btn btn-ghost" type="button" onclick={() => (askMode = false)}>{t.common.cancel}</button>
				{:else}
					<button class="btn btn-primary" type="submit" data-testid="accept">{t.importAi.accept}</button>
				{/if}
				{#if form?.message}<p class="text-sm text-danger-ink" role="alert">{form.message}</p>{/if}
			</form>
		</div>
	</div>
{/if}
