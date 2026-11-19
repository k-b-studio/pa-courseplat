<script lang="ts">
	import { inTray, toggleTray, tray, TRAY_MAX } from '$lib/compare-tray.svelte';
	import EvalBar from '$lib/components/EvalBar.svelte';
	import { t } from '$lib/i18n/th';
	import type { Card } from '$lib/view-types';

	let { card, semesterId }: { card: Card; semesterId: string } = $props();
	const selected = $derived(card.offeringId ? inTray(card.offeringId) : false);
	const full = $derived(!selected && tray.items.length >= TRAY_MAX);
</script>

<article class="card flex flex-col gap-3 p-4 {card.published ? '' : 'opacity-70'}" data-testid="course-card" data-course={card.code}>
	<div class="flex items-start justify-between gap-3">
		<div class="min-w-0">
			<p class="text-sm text-ink-muted">{card.code} · {card.credit_format}</p>
			<h2 class="font-semibold leading-snug">
				{#if card.published}
					<a class="hover:underline" href="/courses/{card.code}/{semesterId}">{card.name_th}</a>
				{:else}
					{card.name_th}
				{/if}
			</h2>
			<p class="text-sm text-ink-muted" lang="en">{card.name_en}</p>
		</div>
	</div>

	<div class="flex flex-wrap gap-1.5">
		{#each card.badges as b (b)}<span class="chip" data-testid="status-badge">{b}</span>{/each}
	</div>

	{#if card.published}
		<dl class="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
			<dt class="text-ink-muted">{t.sections.sections.th}</dt>
			<dd>
				{card.sectionCount}
				{#if card.firstMeeting}· {t.weekdaysShort[card.firstMeeting.weekday]} {card.firstMeeting.starts_at}–{card.firstMeeting.ends_at}{/if}
			</dd>
			<dt class="text-ink-muted">{t.course.hours}</dt>
			<dd>{card.hours ?? '—'} {t.common.hoursPerWeek}</dd>
		</dl>
		{#if card.instructors.length}<p class="text-sm">{card.instructors.join(', ')}</p>{/if}
		{#if card.gradingScheme === 'su'}
			<p class="text-sm text-ink-muted">{t.course.su}</p>
		{:else if card.evalItems.length}
			<EvalBar items={card.evalItems} />
		{/if}
		<div class="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
			<span class="chip bg-success-bg text-success">{t.offeringStatus.published}</span>
			<button
				type="button"
				class="btn {selected ? 'btn-primary' : 'btn-secondary'} text-sm"
				aria-pressed={selected}
				disabled={full || !tray.ready}
				onclick={() => toggleTray({ id: card.offeringId!, code: card.code, name: card.name_th })}
				data-testid="compare-toggle">{selected ? t.course.inCompare : t.course.addCompare}</button
			>
		</div>
	{:else}
		<p class="text-sm text-ink-muted" data-testid="unpublished">{t.course.notPublished}</p>
		{#if card.lastPublished}
			<a class="text-sm text-accent underline" href="/courses/{card.code}/{card.lastPublished.semesterId}">{t.course.lastPublished(card.lastPublished.label)}</a>
		{/if}
	{/if}
</article>
