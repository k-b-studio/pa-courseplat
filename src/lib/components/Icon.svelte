<script lang="ts">
	import { ICON_PATHS, type IconName } from '$lib/icons';

	/** Decorative (aria-hidden): the text beside an icon carries the meaning. */
	let { name, size = 20, class: cls = '' }: { name: IconName; size?: number; class?: string } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" class="inline-block shrink-0 {cls}" aria-hidden="true" focusable="false">
	{#each ICON_PATHS[name] as d (d)}<path {d} />{/each}
</svg>
