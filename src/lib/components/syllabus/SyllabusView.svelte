<script lang="ts">
	import SectionNav from '$lib/components/SectionNav.svelte';
	import { t } from '$lib/i18n/th';
	import type { Snippet } from 'svelte';
	import ApproachBlock from './ApproachBlock.svelte';
	import AtAGlance from './AtAGlance.svelte';
	import type { SyllabusContext } from './context';
	import EvaluationBlock from './EvaluationBlock.svelte';
	import ObjectivesBlock from './ObjectivesBlock.svelte';
	import OverviewBlock from './OverviewBlock.svelte';
	import ProfessorsBlock from './ProfessorsBlock.svelte';
	import ResourcesBlock from './ResourcesBlock.svelte';
	import SectionsBlock from './SectionsBlock.svelte';
	import TimetableBlock from './TimetableBlock.svelte';
	import WorkBlock from './WorkBlock.svelte';

	/**
	 * The nine sections in the brief's order (spec 01, 04 R2). Reused unchanged by the past-version
	 * pages and, in P3, by the editor's "preview as student".
	 */
	let { ctx, after }: { ctx: SyllabusContext; after?: Snippet } = $props();
	const nav = $derived(
		(['overview', 'objectives', 'approach', 'evaluation', 'resources', 'work', 'professors', 'timetable', 'sections'] as const)
			.filter((id) => id !== 'work' || ctx.doc.work.length > 0)
			.map((id) => ({ id, ...t.sections[id] }))
	);
</script>

<div class="grid grid-cols-1 gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start lg:gap-6">
	<div class="min-w-0 lg:sticky lg:top-4 lg:row-span-2"><SectionNav items={nav} /></div>
	<div class="grid min-w-0 gap-4">
		<AtAGlance {ctx} />
		<OverviewBlock {ctx} />
		<ObjectivesBlock {ctx} />
		<ApproachBlock {ctx} />
		<EvaluationBlock {ctx} />
		<ResourcesBlock {ctx} />
		{#if ctx.doc.work.length}<WorkBlock {ctx} />{/if}
		<ProfessorsBlock {ctx} />
		<TimetableBlock {ctx} />
		<SectionsBlock {ctx} />
		{@render after?.()}
	</div>
</div>
