<script lang="ts">
	import { evalColor } from '$lib/domain/eval-colors';
	import { t } from '$lib/i18n/th';

	let { items, height = 'h-2' }: { items: { type: string; weight: number; title: string }[]; height?: string } = $props();
	const total = $derived(items.reduce((s, i) => s + i.weight, 0) || 1);
	const label = $derived(items.map((i) => `${i.title} ${i.weight}%`).join(', '));
</script>

<div class="flex w-full overflow-hidden rounded-full bg-line {height}" role="img" aria-label="{t.sections.evaluation.th}: {label}">
	{#each items as i, n (n)}
		<span style="width:{(i.weight / total) * 100}%; background:{evalColor(i.type)}" title="{i.title} {i.weight}%"></span>
	{/each}
</div>
