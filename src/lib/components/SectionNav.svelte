<script lang="ts">
	import { t } from '$lib/i18n/th';

	/** Sticky section nav: horizontal chips on a phone, a side list from 1024 px (spec 04 R2). */
	let { items }: { items: { id: string; th: string; en: string }[] } = $props();
</script>

<nav aria-label={t.course.sectionNav} class="sticky top-0 z-10 -mx-4 border-b border-line bg-page/95 px-4 py-2 backdrop-blur lg:top-4 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0">
	<ul class="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0.5 lg:overflow-visible">
		{#each items as i (i.id)}
			<li class="shrink-0">
				<a
					href="#{i.id}"
					class="block rounded-full border border-line bg-surface px-3 py-1 text-sm whitespace-nowrap transition-colors hover:border-brand-300 hover:text-brand-800 lg:rounded-none lg:rounded-r-lg lg:border-0 lg:border-l-2 lg:border-line lg:bg-transparent lg:px-3 lg:py-1.5 lg:whitespace-normal lg:hover:border-brand-500 lg:hover:bg-brand-50"
				>
					{i.th}<span class="hidden text-xs text-ink-muted lg:block" lang="en">{i.en}</span>
				</a>
			</li>
		{/each}
	</ul>
</nav>
