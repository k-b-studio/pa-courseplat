<script lang="ts">
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Flash from '$lib/components/Flash.svelte';
	import { t } from '$lib/i18n/th';

	let { data, children } = $props();
</script>

<AppHeader profile={data.profile} demoMode={data.demoMode} cautionBadge={data.cautionBadge} />

{#if data.demoMode}
	<p class="bg-warning-bg px-4 py-1.5 text-center text-xs text-warning-ink" data-testid="demo-data-banner">{t.demoData}</p>
{/if}

{#if data.profile.role === 'viewer'}
	<div class="mx-auto mt-4 max-w-6xl px-4">
		<p class="rounded-lg border border-info/30 bg-info-bg px-4 py-3 text-sm text-info" data-testid="viewer-banner">{t.auth.viewerBanner}</p>
	</div>
{/if}

<Flash flash={data.flash} />

<div class="mx-auto max-w-6xl px-4 py-6">
	{@render children()}
</div>
