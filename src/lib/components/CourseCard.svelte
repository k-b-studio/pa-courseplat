<script lang="ts">
	import { inTray, toggleTray, tray, TRAY_MAX } from '$lib/compare-tray.svelte';
	import EvalBar from '$lib/components/EvalBar.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n/th';
	import type { Card } from '$lib/view-types';

	let { card, semesterId }: { card: Card; semesterId: string } = $props();
	const selected = $derived(card.offeringId ? inTray(card.offeringId) : false);
	const full = $derived(!selected && tray.items.length >= TRAY_MAX);
	// the stripe deepens with the year level (validated pink ramp in app.css)
	const stripe = $derived(`var(--color-level-${Math.min(4, Math.max(1, card.level))})`);
</script>

<article
	class="card flex flex-col overflow-hidden {card.published ? 'card-hover' : 'bg-surface/70'} {selected ? 'ring-2 ring-brand-500' : ''}"
	data-testid="course-card"
	data-course={card.code}
>
	<span class="h-1.5 shrink-0" style="background:{stripe}" aria-hidden="true"></span>
	<div class="flex flex-1 flex-col gap-3 p-4 {card.published ? '' : 'opacity-75'}">
		<div class="flex items-center justify-between gap-2">
			<span class="font-heading text-sm font-medium tracking-wide text-brand-700">{card.code}</span>
			<span class="rounded-full bg-brand-50 px-2 text-xs leading-6 text-brand-800">{t.course.levelN(card.level)} · {card.credit_format}</span>
		</div>
		<div class="min-w-0">
			<h2 class="font-heading text-[1.05rem] leading-snug font-semibold">
				{#if card.published}
					<a class="hover:text-brand-700" href="/courses/{card.code}/{semesterId}">{card.name_th}</a>
				{:else}
					{card.name_th}
				{/if}
			</h2>
			<p class="text-sm text-ink-muted" lang="en">{card.name_en}</p>
		</div>

		<div class="flex flex-wrap gap-1.5">
			{#each card.badges as b (b)}<span class="chip border-line bg-page text-xs text-ink" data-testid="status-badge">{b}</span>{/each}
		</div>

		{#if card.published}
			<dl class="grid gap-1 text-sm">
				<div class="flex items-center gap-2">
					<dt class="flex items-center gap-1.5 text-ink-muted"><Icon name="schedule" size={16} class="text-brand-400" />{t.sections.sections.th}</dt>
					<dd class="ml-auto text-right">
						{card.sectionCount}
						{#if card.firstMeeting}· {t.weekdaysShort[card.firstMeeting.weekday]} {card.firstMeeting.starts_at}–{card.firstMeeting.ends_at}{/if}
					</dd>
				</div>
				<div class="flex items-center gap-2">
					<dt class="flex items-center gap-1.5 text-ink-muted"><Icon name="assignment" size={16} class="text-brand-400" />{t.course.hours}</dt>
					<dd class="ml-auto text-right">{card.hours ?? '—'} {t.common.hoursPerWeek}</dd>
				</div>
			</dl>
			{#if card.instructors.length}<p class="flex items-start gap-1.5 text-sm"><Icon name="person" size={16} class="mt-1 text-brand-400" />{card.instructors.join(', ')}</p>{/if}
			{#if card.gradingScheme === 'su'}
				<p class="text-sm text-ink-muted">{t.course.su}</p>
			{:else if card.evalItems.length}
				<EvalBar items={card.evalItems} />
			{/if}
			<div class="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
				<span class="chip border-transparent bg-success-bg text-xs text-success"><Icon name="check_circle" size={14} />{t.offeringStatus.published}</span>
				<button
					type="button"
					class="btn {selected ? 'btn-primary' : 'btn-secondary'} py-1.5 text-sm"
					aria-pressed={selected}
					disabled={full || !tray.ready}
					onclick={() => toggleTray({ id: card.offeringId!, code: card.code, name: card.name_th })}
					data-testid="compare-toggle"
					><Icon name={selected ? 'check' : 'compare_arrows'} size={16} />{selected ? t.course.inCompare : t.course.addCompare}</button
				>
			</div>
		{:else}
			<p class="text-sm text-ink-muted" data-testid="unpublished">{t.course.notPublished}</p>
			{#if card.lastPublished}
				<a class="text-sm font-medium text-brand-700 underline" href="/courses/{card.code}/{card.lastPublished.semesterId}">{t.course.lastPublished(card.lastPublished.label)}</a>
			{/if}
		{/if}
	</div>
</article>
