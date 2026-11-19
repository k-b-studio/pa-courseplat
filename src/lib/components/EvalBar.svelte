<script lang="ts">
	import { evalColor, evalRank } from '$lib/domain/eval-colors';
	import { t } from '$lib/i18n/th';

	/**
	 * Weights as one stacked bar. Segments are grouped by evaluation type in the palette's fixed order (so every course
	 * stacks the same way and neighbours stay distinguishable) with a 2px gap; each segment names itself on hover, and
	 * the whole bar has a text equivalent for screen readers.
	 */
	let { items, height = 'h-2' }: { items: { type: string; weight: number; title: string }[]; height?: string } = $props();
	const total = $derived(items.reduce((s, i) => s + i.weight, 0) || 1);
	const sorted = $derived(
		items
			.map((i, n) => ({ ...i, n }))
			.filter((i) => i.weight > 0)
			.sort((a, b) => evalRank(a.type) - evalRank(b.type) || b.weight - a.weight || a.n - b.n)
	);
	const label = $derived(items.map((i) => `${i.title} ${i.weight}%`).join(', '));
</script>

<div class="flex w-full gap-0.5 overflow-hidden rounded-full {height}" role="img" aria-label="{t.sections.evaluation.th}: {label}">
	{#each sorted as i (i.n)}
		<span class="first:rounded-l-full last:rounded-r-full" style="width:{(i.weight / total) * 100}%; background:{evalColor(i.type)}" title="{i.title} {i.weight}%"></span>
	{/each}
</div>
