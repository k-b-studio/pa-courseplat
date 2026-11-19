<script lang="ts">
	import { initials } from '$lib/domain/people';
	import { isExamWeek, weekRange } from '$lib/domain/weeks';
	import { t, thaiDate } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx, highlight }: { ctx: SyllabusContext; highlight?: (concept: string) => boolean } = $props();
	const days = $derived([1, 2, 3, 4, 5, ...(ctx.sections.some((s) => s.meetings.some((m) => m.weekday >= 6)) ? [6] : [])]);
	const nameOf = (id: string) => ctx.instructors.find((p) => p.id === id);
	const readingOf = (id: string) => ctx.doc.resources.readings.find((r) => r.id === id);
	const short = (s: string) => (s.length > 42 ? s.slice(0, 40) + '…' : s);
	const dateLabel = (week: number) => {
		const { from, to } = weekRange(ctx.semester.starts_on, week);
		return `${thaiDate(from)} – ${thaiDate(to)}`;
	};
</script>

<Block id="timetable" th={t.sections.timetable.th} en={t.sections.timetable.en}>
	<div>
		<h3 class="label">{t.course.weeklyGrid}</h3>
		<table class="mt-2 w-full table-fixed border-collapse text-center text-xs" data-testid="weekly-grid">
			<thead>
				<tr>
					<th class="w-14 p-1 text-left font-normal text-ink-muted">{t.common.section}</th>
					{#each days as d (d)}<th class="p-1 font-medium">{t.weekdaysShort[d]}</th>{/each}
				</tr>
			</thead>
			<tbody>
				{#each ctx.sections as s (s.id)}
					<tr class="border-t border-line">
						<th class="p-1 text-left font-normal">{s.section_no}</th>
						{#each days as d (d)}
							{@const ms = s.meetings.filter((m) => m.weekday === d)}
							<td class="p-1 {ms.length ? 'bg-accent-light text-accent-dark' : ''}">
								{#each ms as m (m.starts_at)}<span class="block">{m.starts_at}–{m.ends_at}</span>{/each}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div>
		<h3 class="label">{t.course.plan}</h3>
		<ol class="mt-2 grid gap-2" data-testid="weekly-plan">
			{#each ctx.doc.weeklyPlan as w (w.week)}
				{@const exam = w.noClass && isExamWeek(w.topic)}
				<li class="rounded-lg border border-line px-3 py-2.5 {w.noClass ? 'bg-page' : ''} {exam ? 'border-warning/40 bg-warning-bg' : ''}" data-week={w.week} data-exam={exam ? 'true' : undefined} data-date={weekRange(ctx.semester.starts_on, w.week).from}>
					<p class="flex flex-wrap items-baseline justify-between gap-x-2 text-xs text-ink-muted">
						<span class="font-semibold text-ink">{t.common.weekN(w.week)}</span>
						<span>{dateLabel(w.week)}</span>
					</p>
					<p class="mt-0.5 font-medium">{w.topic}{#if w.noClass && !exam}<span class="ml-1 text-sm font-normal text-ink-muted">({t.course.noClass})</span>{/if}</p>
					{#if w.details}<p class="text-sm text-ink-muted">{w.details}</p>{/if}
					{#if w.concepts.length || w.instructorIds.length}
						<div class="mt-1 flex flex-wrap items-center gap-1.5">
							{#each w.concepts as c (c)}<span class="chip text-xs {highlight?.(c) ? 'bg-warning-bg text-warning-ink' : ''}" lang="en">{c}</span>{/each}
							{#each w.instructorIds as id (id)}
								{@const p = nameOf(id)}
								{#if p}<span class="rounded-full bg-accent text-white px-1.5 text-xs leading-5" title={p.name_th ?? ''}>{initials(p.name_th)}</span>{/if}
							{/each}
						</div>
					{/if}
					{#if w.readingIds.length}
						<p class="mt-1 text-xs text-ink-muted">{t.course.readings}: {w.readingIds.map((id) => short(readingOf(id)?.title ?? id)).join(' · ')}</p>
					{/if}
					{#if w.activity}<p class="mt-1 text-xs"><span class="text-ink-muted">{t.course.activity}:</span> {w.activity}</p>{/if}
				</li>
			{/each}
		</ol>
	</div>

	{#if ctx.doc.keyDates.length}
		<div>
			<h3 class="label">{t.course.keyDates}</h3>
			<ul class="mt-1 grid gap-1 text-sm">
				{#each ctx.doc.keyDates as k, i (i)}
					<li>
						<strong>{k.label}</strong>
						{#if k.date} — {thaiDate(k.date)}{:else if k.week} — {t.common.weekN(k.week)} ({dateLabel(k.week)}){/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</Block>
