<script lang="ts">
	import { evalColor } from '$lib/domain/eval-colors';

	/** Evaluation donut. Decorative for screen readers: the evaluation table is its text equivalent (spec 04 R6). */
	let { items, size = 132 }: { items: { type: string; weightPercent: number; title: string }[]; size?: number } = $props();
	const r = 15.9155; // circumference 100
	const total = $derived(items.reduce((s, i) => s + i.weightPercent, 0));
	const segments = $derived.by(() => {
		let offset = 25; // start at 12 o'clock
		return items.map((i) => {
			const seg = { ...i, dash: `${i.weightPercent} ${100 - i.weightPercent}`, offset };
			offset = (offset - i.weightPercent + 100) % 100;
			return seg;
		});
	});
</script>

<svg viewBox="0 0 42 42" width={size} height={size} aria-hidden="true" data-testid="donut" data-total={total}>
	<circle cx="21" cy="21" {r} fill="none" style="stroke: var(--color-line)" stroke-width="6" />
	{#each segments as s, n (n)}
		<!-- CSS variables only work in style, not in SVG presentation attributes -->
		<circle cx="21" cy="21" {r} fill="none" style="stroke: {evalColor(s.type)}" stroke-width="6" stroke-dasharray={s.dash} stroke-dashoffset={s.offset}>
			<title>{s.title} {s.weightPercent}%</title>
		</circle>
	{/each}
	<text x="21" y="22.5" text-anchor="middle" font-size="6" font-weight="600" style="fill: var(--color-ink)">{total}%</text>
</svg>
