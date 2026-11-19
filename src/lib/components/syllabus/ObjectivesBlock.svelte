<script lang="ts">
	import { t } from '$lib/i18n/th';
	import Block from './Block.svelte';
	import type { SyllabusContext } from './context';

	let { ctx }: { ctx: SyllabusContext } = $props();
</script>

<Block id="objectives" th={t.sections.objectives.th} en={t.sections.objectives.en}>
	<ol class="grid gap-3">
		{#each ctx.doc.objectives as o, i (o.id)}
			<li class="flex gap-3">
				<span class="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-light text-xs font-semibold text-accent-dark">{i + 1}</span>
				<div class="min-w-0">
					<p>{o.text}</p>
					<div class="mt-1 flex flex-wrap gap-1.5">
						{#each o.ploCodes as code (code)}
							<!-- tapping a chip shows the PLO's Thai text (spec 04 R2) -->
							<details class="group">
								<summary class="chip cursor-pointer list-none group-open:bg-accent group-open:text-white" title={t.course.ploTitle}>{code}</summary>
								<p class="mt-1 max-w-prose rounded-md bg-page px-3 py-2 text-sm">{ctx.plos[code] ?? code}</p>
							</details>
						{/each}
					</div>
				</div>
			</li>
		{/each}
	</ol>
</Block>
