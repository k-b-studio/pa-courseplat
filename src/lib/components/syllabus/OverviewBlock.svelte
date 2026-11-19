<script lang="ts">
	import { t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
	const o = $derived(ctx.doc.overview);
</script>

<Block id="overview" th={t.sections.overview.th} en={t.sections.overview.en}>
	{#if ctx.course.description_th || ctx.course.description_en}
		<div>
			<h3 class="label">{t.course.officialDescription}</h3>
			{#if ctx.course.description_th}<p class="mt-1">{ctx.course.description_th}</p>{/if}
			{#if ctx.course.description_en}<p class="mt-1 text-sm text-ink-muted" lang="en">{ctx.course.description_en}</p>{/if}
		</div>
	{/if}
	<div>
		<h3 class="label">{t.course.focus}</h3>
		<p class="mt-1">{o.focus}</p>
	</div>
	{#if o.keywords.length}
		<div class="flex flex-wrap gap-1.5" aria-label={t.course.keywords}>
			{#each o.keywords as k (k)}<span class="chip" lang="en">{k}</span>{/each}
		</div>
	{/if}
	{#if o.prerequisiteNote}<p class="text-sm"><span class="text-ink-muted">{t.course.prerequisiteNote}:</span> {o.prerequisiteNote}</p>{/if}
</Block>
