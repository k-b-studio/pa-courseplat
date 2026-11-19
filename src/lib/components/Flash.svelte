<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n/th';

	let { flash }: { flash: string | null } = $props();
	let dismissed = $state<string | null>(null);
	const message = $derived(flash && flash !== dismissed ? t.flash[flash] : null);
</script>

{#if message}
	<div class="mx-auto mt-4 max-w-6xl px-4">
		<div class="flex items-start gap-3 rounded-xl border border-brand-200 border-l-4 border-l-brand-600 bg-surface px-4 py-3 text-sm shadow-[var(--shadow-card)]" role="status" data-testid="flash">
			<Icon name="info" size={18} class="mt-0.5 text-brand-600" />
			<p class="flex-1">{message}</p>
			<button class="rounded-full p-0.5 text-ink-muted hover:bg-brand-50 hover:text-ink" type="button" onclick={() => (dismissed = flash)} aria-label={t.common.close}><Icon name="close" size={18} /></button>
		</div>
	</div>
{/if}
