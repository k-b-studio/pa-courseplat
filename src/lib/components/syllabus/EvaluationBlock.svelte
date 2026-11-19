<script lang="ts">
	import Donut from '$lib/components/Donut.svelte';
	import { evalColor } from '$lib/domain/eval-colors';
	import { t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
	const e = $derived(ctx.doc.evaluation);
</script>

<Block id="evaluation" th={t.sections.evaluation.th} en={t.sections.evaluation.en}>
	{#if e.gradingScheme === 'su'}
		<p class="chip self-start">{t.course.su}</p>
	{:else}
		<div class="flex justify-center sm:justify-start"><Donut items={e.items} /></div>
	{/if}
	<!-- the table is the donut's text equivalent (spec 04 R6) -->
	<ul class="divide-y divide-line rounded-lg border border-line" data-testid="evaluation-table">
		{#each e.items as i (i.id)}
			<li class="grid grid-cols-[auto_1fr_auto] items-start gap-x-3 px-3 py-2.5">
				<span class="mt-1.5 inline-block size-2.5 rounded-full" style="background:{evalColor(i.type)}" aria-hidden="true"></span>
				<div class="min-w-0">
					<p class="font-medium">{i.title}</p>
					<p class="text-sm text-ink-muted">
						{t.evalTypes[i.type] ?? i.type} · {i.individual ? t.course.individual : t.course.group}{#if i.dueWeek} · {t.common.weekN(i.dueWeek)}{/if}
					</p>
					{#if i.description}<p class="mt-0.5 text-sm">{i.description}</p>{/if}
				</div>
				<span class="font-semibold tabular-nums">{i.weightPercent}%</span>
			</li>
		{/each}
	</ul>
	{#if e.gradingScheme === 'letter' && e.cutoffs.length}
		<div>
			<h3 class="label">{t.course.cutoffs} · {t.referencing[e.referencing]}</h3>
			<p class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums">
				{#each e.cutoffs as c (c.grade)}<span><strong>{c.grade}</strong> ≥ {c.minPercent}</span>{/each}
			</p>
		</div>
	{/if}
</Block>
