<script lang="ts">
	import { t } from '$lib/i18n/th';
	import type { ValidationIssue } from '$lib/schema/syllabus';
	import { anchorFor } from './types';

	/** Strict-schema checklist (spec 05 R6): sticky panel on desktop, bottom sheet on a phone. */
	let { issues, onpublish, busy = false, published = false, dirty = false }: { issues: ValidationIssue[]; onpublish: () => void; busy?: boolean; published?: boolean; dirty?: boolean } = $props();
	let sheetOpen = $state(false);
	const ready = $derived(issues.length === 0);
</script>

{#snippet body()}
	<div class="flex items-center justify-between gap-2">
		<h2 class="min-w-0 font-semibold">{t.editor.readiness}</h2>
		<span class="chip shrink-0 {ready ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger-ink'}" data-testid="readiness-status">{ready ? t.editor.ready : t.editor.issuesN(issues.length)}</span>
	</div>
	{#if issues.length}
		<ul class="mt-2 grid max-h-72 gap-1 overflow-y-auto text-sm" data-testid="readiness-list">
			{#each issues as i, n (n)}<li><a class="text-danger-ink underline decoration-dotted" href="#{anchorFor(i.path)}" onclick={() => (sheetOpen = false)}>{i.message}</a></li>{/each}
		</ul>
	{/if}
	<button type="button" class="btn btn-primary mt-3 w-full" disabled={!ready || busy || dirty} onclick={onpublish} data-testid="publish">{published ? t.editor.republish : t.editor.publish}</button>
	{#if published}<p class="mt-2 text-xs text-ink-muted">{t.editor.publishedNote}</p>{/if}
{/snippet}

<div class="card hidden min-w-0 p-4 wrap-anywhere lg:block" data-testid="readiness">{@render body()}</div>

<div class="fixed inset-x-0 bottom-0 z-30 max-h-[70dvh] overflow-y-auto border-t border-line-strong bg-surface p-3 wrap-anywhere shadow-[0_-4px_12px_rgba(0,0,0,0.08)] lg:hidden" data-testid="readiness-sheet">
	{#if sheetOpen}<div class="mb-3">{@render body()}</div>{/if}
	<button type="button" class="flex w-full items-center justify-between text-sm font-medium" aria-expanded={sheetOpen} onclick={() => (sheetOpen = !sheetOpen)}>
		<span>{t.editor.readiness}</span>
		<span class="chip {ready ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger-ink'}">{ready ? t.editor.ready : t.editor.issuesN(issues.length)} {sheetOpen ? '▾' : '▴'}</span>
	</button>
</div>
