<script lang="ts">
	import type { Snippet } from 'svelte';

	/** One collapsible section of the editor, in the student order (spec 05 R3). */
	let {
		id,
		th,
		en,
		issues = 0,
		tone,
		open = $bindable(true),
		badge,
		children
	}: { id: string; th: string; en: string; issues?: number; tone?: 'warn'; open?: boolean; badge?: Snippet; children: Snippet } = $props();
</script>

<section {id} class="card scroll-mt-20 {issues ? 'border-danger/40' : ''} {tone === 'warn' ? 'outline-2 outline-offset-2 outline-warning/70' : ''}" data-testid="editor-{id}" data-tone={tone}>
	<div class="flex items-center gap-2 px-4 py-3 sm:px-5">
		<h2 class="m-0 min-w-0 flex-1">
			<button type="button" class="flex w-full items-center gap-2 text-left" aria-expanded={open} onclick={() => (open = !open)}>
				<span class="text-base font-semibold text-accent-dark">{th}</span>
				<span class="hidden text-sm text-ink-muted sm:inline" lang="en">· {en}</span>
			</button>
		</h2>
		<!-- outside the toggle button: badges may hold their own controls (evidence popover) -->
		{@render badge?.()}
		{#if issues}<span class="chip bg-danger-bg text-danger-ink" data-testid="card-issues">{issues}</span>{/if}
		<button type="button" class="text-ink-muted" aria-hidden="true" tabindex="-1" onclick={() => (open = !open)}>{open ? '▴' : '▾'}</button>
	</div>
	{#if open}<div class="grid gap-4 border-t border-line px-4 py-4 sm:px-5">{@render children()}</div>{/if}
</section>
