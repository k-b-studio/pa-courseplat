<script lang="ts">
	import { diffDocs, isEmptyDiff } from '$lib/domain/diff';
	import { t } from '$lib/i18n/th';
	import type { SyllabusDoc } from '$lib/schema/syllabus';

	/** Compact field-level diff (spec 05 R10), older → current. */
	let { from, to }: { from: SyllabusDoc; to: SyllabusDoc } = $props();
	const d = $derived(diffDocs(from, to));
</script>

<div class="grid gap-2 text-sm" data-testid="diff">
	{#if isEmptyDiff(d)}<p class="text-ink-muted">{t.editor.diffNone}</p>{/if}
	{#if d.focusChanged}<p>• {t.editor.diffFocus}</p>{/if}
	{#each d.weeks.added as w (w.week)}<p class="text-success">+ {t.editor.diffWeekAdded(w.week, w.topic)}</p>{/each}
	{#each d.weeks.removed as w (w.week)}<p class="text-danger-ink">− {t.editor.diffWeekRemoved(w.week, w.topic)}</p>{/each}
	{#each d.weeks.changed as w (w.week)}
		<div data-testid="diff-week" data-week={w.week}><p class="font-medium">~ {t.editor.diffWeekChanged(w.week)}</p><p class="pl-3 text-ink-muted line-through">{w.from}</p><p class="pl-3">{w.to}</p></div>
	{/each}
	{#each d.evaluation.changed as e (e.title)}<p data-testid="diff-eval">~ {t.editor.diffEvalChanged(e.title, e.from, e.to)}</p>{/each}
	{#each d.evaluation.added as e (e.title)}<p class="text-success">+ {t.editor.diffEvalAdded(e.title, e.weight)}</p>{/each}
	{#each d.evaluation.removed as e (e.title)}<p class="text-danger-ink">− {t.editor.diffEvalRemoved(e.title, e.weight)}</p>{/each}
	{#if d.readings.added.length}<p class="font-medium">{t.editor.diffReadingAdded}</p>{#each d.readings.added as r (r)}<p class="pl-3 text-success">+ {r}</p>{/each}{/if}
	{#if d.readings.removed.length}<p class="font-medium">{t.editor.diffReadingRemoved}</p>{#each d.readings.removed as r (r)}<p class="pl-3 text-danger-ink">− {r}</p>{/each}{/if}
	{#if d.objectives.added.length || d.objectives.removed.length}
		<p class="font-medium">{t.editor.diffObjectives}</p>
		{#each d.objectives.removed as o (o)}<p class="pl-3 text-danger-ink">− {o}</p>{/each}
		{#each d.objectives.added as o (o)}<p class="pl-3 text-success">+ {o}</p>{/each}
	{/if}
</div>
