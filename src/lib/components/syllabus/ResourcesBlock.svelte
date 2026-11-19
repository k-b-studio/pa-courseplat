<script lang="ts">
	import { t } from '$lib/i18n/th';
	import type { Reading } from '$lib/schema/syllabus';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx, highlight = new Set() }: { ctx: SyllabusContext; highlight?: Set<string> } = $props();
	const r = $derived(ctx.doc.resources);
	const required = $derived(r.readings.filter((x) => x.required));
	const recommended = $derived(r.readings.filter((x) => !x.required));
	const safeUrl = (u: string | null) => (u && /^https?:\/\//i.test(u) ? u : null);
</script>

{#snippet list(items: Reading[], title: string)}
	{#if items.length}
		<div>
			<h3 class="label">{title}</h3>
			<ul class="mt-1 grid gap-2">
				{#each items as x (x.id)}
					<li class="text-sm {highlight.has(x.id) ? 'rounded-md bg-warning-bg px-2 py-1' : ''}" data-reading={x.id}>
						<span class="chip mr-1 text-xs">{t.readingTypes[x.type] ?? x.type}</span>
						<span lang={/[ก-๙]/.test(x.citation) ? 'th' : 'en'}>{x.citation}</span>
						{#if safeUrl(x.url)}<a class="ml-1 text-accent underline" href={safeUrl(x.url)} target="_blank" rel="noopener noreferrer">{t.course.readingLink}</a>{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
{/snippet}

<Block id="resources" th={t.sections.resources.th} en={t.sections.resources.en}>
	{@render list(required, t.course.required)}
	{@render list(recommended, t.course.recommended)}
	{#if r.materials.length}
		<div>
			<h3 class="label">{t.course.materials}</h3>
			<ul class="mt-1 list-disc pl-5 text-sm">{#each r.materials as m (m)}<li>{m}</li>{/each}</ul>
		</div>
	{/if}
	{#if r.platforms.length}
		<div>
			<h3 class="label">{t.course.platforms}</h3>
			<ul class="mt-1 grid gap-1 text-sm">
				{#each r.platforms as p (p.name)}
					<li>
						{#if safeUrl(p.url)}<a class="text-accent underline" href={safeUrl(p.url)} target="_blank" rel="noopener noreferrer">{p.name}</a>{:else}<strong>{p.name}</strong>{/if}
						{#if p.note}<span class="text-ink-muted"> — {p.note}</span>{/if}
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</Block>
