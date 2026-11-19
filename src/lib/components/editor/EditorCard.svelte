<script lang="ts">
	import type { Snippet } from 'svelte';

	/** One collapsible section of the editor, in the student order (spec 05 R3). */
	let {
		id,
		th,
		en,
		issues = 0,
		open = $bindable(true),
		badge,
		children
	}: { id: string; th: string; en: string; issues?: number; open?: boolean; badge?: Snippet; children: Snippet } = $props();
</script>

<section {id} class="card scroll-mt-20 {issues ? 'border-danger/40' : ''}" data-testid="editor-{id}">
	<h2 class="m-0">
		<button type="button" class="flex w-full items-center gap-2 px-4 py-3 text-left sm:px-5" aria-expanded={open} onclick={() => (open = !open)}>
			<span class="text-base font-semibold text-accent-dark">{th}</span>
			<span class="hidden text-sm text-ink-muted sm:inline" lang="en">· {en}</span>
			{@render badge?.()}
			{#if issues}<span class="ml-auto chip bg-danger-bg text-danger-ink" data-testid="card-issues">{issues}</span>{/if}
			<span class="{issues ? '' : 'ml-auto'} text-ink-muted" aria-hidden="true">{open ? '▴' : '▾'}</span>
		</button>
	</h2>
	{#if open}<div class="grid gap-4 border-t border-line px-4 py-4 sm:px-5">{@render children()}</div>{/if}
</section>
