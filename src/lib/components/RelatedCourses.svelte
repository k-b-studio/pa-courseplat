<script lang="ts">
	import { t } from '$lib/i18n/th';
	import type { RelatedCourse } from '$lib/view-types';

	/** Catalog only: prerequisites both ways. Never Content Caution data (spec 04 R2, AC 6). */
	let {
		related,
		past = [],
		code = ''
	}: { related: { requires: RelatedCourse[]; buildsFor: RelatedCourse[] }; past?: { versionId: string; label: string }[]; code?: string } = $props();
</script>

<section id="related" class="card scroll-mt-16 p-5 sm:p-6" aria-labelledby="related-title" data-testid="related-courses">
	<h2 id="related-title" class="text-lg font-semibold text-accent-dark">{t.course.related}</h2>
	{#if !related.requires.length && !related.buildsFor.length}<p class="mt-2 text-sm text-ink-muted">{t.course.noRelated}</p>{/if}
	{#each [[t.course.requires, related.requires, 'requires'], [t.course.buildsFor, related.buildsFor, 'builds-for']] as const as [label, list, kind] (kind)}
		{#if list.length}
			<div class="mt-3" data-testid="related-{kind}">
				<h3 class="label">{label}</h3>
				<ul class="mt-1 flex flex-wrap gap-2">
					{#each list as c (c.code)}<li><a class="chip border border-line bg-surface hover:border-accent" href="/courses/{c.code}">{c.code} {c.name_th}</a></li>{/each}
				</ul>
			</div>
		{/if}
	{/each}
	{#if past.length}
		<div class="mt-4" data-testid="past-versions">
			<h3 class="label">{t.course.pastVersions}</h3>
			<ul class="mt-1 flex flex-wrap gap-2">
				{#each past as v (v.versionId)}<li><a class="chip border border-line bg-surface hover:border-accent" href="/courses/{code}/versions/{v.versionId}">{v.label}</a></li>{/each}
			</ul>
		</div>
	{/if}
</section>
