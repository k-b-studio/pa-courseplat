<script lang="ts">
	import Heatmap from '$lib/components/Heatmap.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { evalColor } from '$lib/domain/eval-colors';
	import { clashes, isShared, sharedConcepts, sharedReadings } from '$lib/domain/compare';
	import { basketLoad, hoursPerWeek } from '$lib/domain/workload';
	import { personName, t } from '$lib/i18n/th';
	import type { Snippet } from 'svelte';

	let { data } = $props();
	const cols = $derived(data.columns);
	const shared = $derived(sharedConcepts(cols.map((c) => c.doc)));
	const sharedR = $derived(sharedReadings(cols.map((c) => c.doc)));
	const basket = $derived(basketLoad(cols.map((c) => ({ doc: c.doc, course: c.course.code }))));
	/** a column clashes if any of its sections overlaps any section of another column */
	const clashing = $derived(
		cols.map((c, i) => cols.some((o, j) => j !== i && c.sections.some((s) => o.sections.some((x) => clashes(s.meetings, x.meetings)))))
	);
	const sharedTopicsOf = (i: number) => [
		...new Set(cols[i].doc.weeklyPlan.flatMap((w) => w.concepts.filter((c) => isShared(shared, c))).concat(cols[i].doc.overview.keywords.filter((k) => isShared(shared, k))))
	];
	const gridCols = $derived(['', 'md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3'][cols.length]);
</script>

{#snippet row(title: string, cell: Snippet<[number]>, testid = '')}
	<section class="card p-4" data-testid={testid || undefined}>
		<h2 class="eyebrow border-l-4 border-brand-500 pl-2.5 text-sm">{title}</h2>
		<div class="mt-2 grid grid-cols-1 gap-4 {gridCols}">
			{#each cols as c, i (c.offeringId)}
				<div class="min-w-0">
					<p class="text-xs font-semibold text-brand-700 md:hidden">{c.course.code}</p>
					{@render cell(i)}
				</div>
			{/each}
		</div>
	</section>
{/snippet}

<h1 class="text-3xl font-semibold tracking-tight">{t.compare.title}</h1>
{#if cols.length === 0}
	<div class="card mt-4 flex flex-col items-center gap-3 px-6 py-10 text-center">
		<span class="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-500"><Icon name="compare_arrows" size={28} /></span>
		<p class="max-w-md text-ink-muted">{t.compare.empty}</p>
		<a class="btn btn-primary" href="/courses"><Icon name="menu_book" size={18} />{t.nav.courses}</a>
	</div>
{:else}
	<div class="mt-4 grid gap-3">
		<div class="grid grid-cols-1 gap-3 {gridCols}">
			{#each cols as c (c.offeringId)}
				<a class="card card-hover block overflow-hidden" href="/courses/{c.course.code}/{c.semester.id}" data-testid="compare-column" data-course={c.course.code}>
					<span class="block h-1.5" style="background:var(--color-level-{Math.min(4, Math.max(1, Number(c.course.code[4])))})" aria-hidden="true"></span>
					<div class="p-4">
					<p class="text-sm"><span class="font-heading font-medium tracking-wide text-brand-700">{c.course.code}</span> <span class="text-ink-muted">· {c.semester.label}</span></p>
					<p class="font-heading font-semibold">{c.course.name_th}</p>
					{#if clashing[cols.indexOf(c)]}<p class="chip mt-2 bg-danger-bg text-danger-ink" data-testid="clash">{t.compare.clash}</p>{/if}
					</div>
				</a>
			{/each}
		</div>

		{#snippet glance(i: number)}
			{@const d = cols[i].doc}
			<p class="text-sm">{t.course.hours}: {hoursPerWeek(d, cols[i].course.credit_format) ?? '—'} {t.common.hoursPerWeek}</p>
			<p class="text-sm">{t.language[d.overview.language]} · {t.aiPolicy[d.approach.aiPolicy]}</p>
			<p class="mt-1 text-sm text-ink-muted">{d.overview.focus}</p>
		{/snippet}
		{@render row(t.course.atGlance, glance)}

		{#snippet topics(i: number)}
			{@const list = sharedTopicsOf(i)}
			{#if list.length}
				<div class="flex flex-wrap gap-1.5">{#each list as c (c)}<span class="chip bg-warning-bg text-warning-ink" lang="en" data-testid="shared-topic">{c}</span>{/each}</div>
			{:else}<p class="text-sm text-ink-muted">—</p>{/if}
		{/snippet}
		{@render row(t.compare.sharedTopics, topics, 'shared-topics')}

		{#snippet objectives(i: number)}
			<ol class="grid list-decimal gap-1 pl-5 text-sm">
				{#each cols[i].doc.objectives as o (o.id)}<li>{o.text} <span class="text-xs text-ink-muted">{o.ploCodes.join(' ')}</span></li>{/each}
			</ol>
		{/snippet}
		{@render row(t.sections.objectives.th, objectives)}

		{#snippet approach(i: number)}
			<div class="flex flex-wrap gap-1.5">{#each cols[i].doc.approach.methods as m (m)}<span class="chip">{t.teachingMethods[m] ?? m}</span>{/each}</div>
		{/snippet}
		{@render row(t.sections.approach.th, approach)}

		{#snippet evaluation(i: number)}
			<!-- bars on one 0–100 scale (spec 04 R3) -->
			<ul class="grid gap-1.5 text-sm">
				{#each cols[i].doc.evaluation.items as e (e.id)}
					<li>
						<span class="flex justify-between gap-2"><span class="truncate">{e.title}</span><strong>{e.weightPercent}%</strong></span>
						<span class="block h-1.5 w-full rounded-full bg-line" aria-hidden="true"><span class="block h-1.5 rounded-full" style="width:{e.weightPercent}%; background:{evalColor(e.type)}"></span></span>
					</li>
				{/each}
			</ul>
		{/snippet}
		{@render row(t.sections.evaluation.th, evaluation)}

		<section class="card p-4">
			<h2 class="label">{t.compare.heatmap}</h2>
			<div class="mt-2"><Heatmap {basket} labels={cols.map((c) => c.course.code)} /></div>
		</section>

		{#snippet work(i: number)}
			{#if cols[i].doc.work.length}
				<ul class="grid gap-1 text-sm">{#each cols[i].doc.work as w (w.id)}<li>{w.title}{#if w.dueWeek} <span class="text-ink-muted">({t.common.weekN(w.dueWeek)})</span>{/if}</li>{/each}</ul>
			{:else}<p class="text-sm text-ink-muted">—</p>{/if}
		{/snippet}
		{@render row(t.compare.work, work)}

		{#snippet readings(i: number)}
			<ul class="grid gap-1 text-sm">
				{#each cols[i].doc.resources.readings as r (r.id)}
					<li class={sharedR[i].has(r.id) ? 'rounded bg-warning-bg px-1' : ''} data-shared={sharedR[i].has(r.id) ? 'true' : undefined}>
						{r.title}{#if sharedR[i].has(r.id)} <span class="text-xs text-warning-ink">· {t.compare.sharedReading}</span>{/if}
					</li>
				{/each}
			</ul>
		{/snippet}
		{@render row(t.sections.resources.th, readings, 'compare-readings')}

		{#snippet meetings(i: number)}
			<ul class="grid gap-1 text-sm">
				{#each cols[i].sections as s (s.id)}
					<li>
						{t.common.sectionN(s.section_no)}: {s.meetings.map((m) => `${t.weekdaysShort[m.weekday]} ${m.starts_at}–${m.ends_at}`).join(', ')}
						<span class="block text-xs text-ink-muted">{s.instructors.map((p) => personName(p)).join(', ')}</span>
					</li>
				{/each}
			</ul>
		{/snippet}
		{@render row(t.course.meetings, meetings)}
	</div>
{/if}
