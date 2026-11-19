<script lang="ts">
	import { t } from '$lib/i18n/th';

	/** Chips typed with Enter or comma (concept tags, keywords). */
	let { tags = $bindable([]), label, max = 20, id }: { tags: string[]; label: string; max?: number; id?: string } = $props();
	let draft = $state('');

	function add() {
		const parts = draft.split(',').map((x) => x.trim()).filter(Boolean);
		for (const p of parts) if (!tags.includes(p) && tags.length < max) tags.push(p);
		draft = '';
	}
	function onkey(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			add();
		} else if (e.key === 'Backspace' && !draft && tags.length) tags.pop();
	}
</script>

<div class="grid gap-1">
	<label class="label" for={id}>{label}</label>
	<div class="input flex min-h-10 flex-wrap items-center gap-1.5 py-1.5">
		{#each tags as tag, i (tag)}
			<span class="chip gap-1" lang="en">{tag}<button type="button" class="text-ink-muted hover:text-danger" aria-label="{t.editor.remove} {tag}" onclick={() => tags.splice(i, 1)}>✕</button></span>
		{/each}
		<input {id} class="min-w-24 flex-1 bg-transparent outline-none" bind:value={draft} onkeydown={onkey} onblur={add} placeholder={tags.length < max ? t.editor.tagHint : ''} disabled={tags.length >= max} />
	</div>
</div>
