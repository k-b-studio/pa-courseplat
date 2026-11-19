<script lang="ts">
	import { t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
	const a = $derived(ctx.doc.approach);
</script>

<Block id="approach" th={t.sections.approach.th} en={t.sections.approach.en}>
	<div class="flex flex-wrap gap-1.5" aria-label={t.course.methods}>
		{#each a.methods as m (m)}<span class="chip">{t.teachingMethods[m] ?? m}</span>{/each}
	</div>
	{#if a.description}<p>{a.description}</p>{/if}
	<dl class="grid gap-3 text-sm sm:grid-cols-[10rem_1fr]">
		{#if a.attendancePolicy}<dt class="text-ink-muted">{t.course.attendance}</dt><dd>{a.attendancePolicy}</dd>{/if}
		<dt class="text-ink-muted">{t.course.aiPolicy}</dt>
		<dd><span class="chip bg-info-bg text-info">{t.aiPolicy[a.aiPolicy]}</span>{#if a.aiPolicyNote}<span class="mt-1 block">{a.aiPolicyNote}</span>{/if}</dd>
		{#if a.lateWorkPolicy}<dt class="text-ink-muted">{t.course.lateWork}</dt><dd>{a.lateWorkPolicy}</dd>{/if}
	</dl>
</Block>
