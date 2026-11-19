<script lang="ts">
	import { t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	/** Rendered only when the syllabus has work items (the brief marks Work optional; spec 04 R2). */
	let { ctx }: { ctx: SyllabusContext } = $props();
	const weight = (id: string | null) => ctx.doc.evaluation.items.find((e) => e.id === id)?.weightPercent;
</script>

<Block id="work" th={t.sections.work.th} en={t.sections.work.en}>
	<ul class="grid gap-3">
		{#each ctx.doc.work as w (w.id)}
			<li class="rounded-lg border border-line p-4" data-work={w.id}>
				<div class="flex flex-wrap items-start justify-between gap-2">
					<h3 class="font-medium">{w.title}</h3>
					{#if weight(w.evaluationItemId) != null}<span class="chip">{weight(w.evaluationItemId)}%</span>{/if}
				</div>
				<p class="mt-1 text-sm text-ink-muted">
					{t.workTypes[w.type] ?? w.type} · {w.individual ? t.course.individual : `${t.course.group}${w.groupSize ? ` ${w.groupSize} คน` : ''}`}{#if w.dueWeek} · {t.course.dueWeek} {t.common.weekN(w.dueWeek)}{/if}{#if w.estimatedHours} · {t.course.hoursN(w.estimatedHours)}{/if}
				</p>
				{#if w.description}<p class="mt-2 text-sm">{w.description}</p>{/if}
				{#if w.deliverable}<p class="mt-1 text-sm"><span class="text-ink-muted">{t.course.deliverable}:</span> {w.deliverable}</p>{/if}
			</li>
		{/each}
	</ul>
</Block>
