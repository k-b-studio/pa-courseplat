<script lang="ts">
	import type { Snippet } from 'svelte';

	/** One of the nine anchored sections, titled Thai first with the brief's English name (spec 01, 04). */
	let { id, th, en, children }: { id: string; th: string; en: string; children: Snippet } = $props();
</script>

<section {id} class="card scroll-mt-16 p-5 sm:p-6 lg:scroll-mt-6" aria-labelledby="{id}-title" data-testid="block-{id}">
	<h2 id="{id}-title" class="flex flex-wrap items-baseline gap-x-2 border-l-4 border-brand-500 pl-3 text-lg font-semibold text-ink">
		{th} <span class="text-sm font-normal text-ink-muted" lang="en">· {en}</span>
	</h2>
	<div class="mt-3 grid gap-4">
		{@render children()}
	</div>
</section>
