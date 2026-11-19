<script lang="ts">
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Flash from '$lib/components/Flash.svelte';
	import Icon from '$lib/components/Icon.svelte';
	import { t } from '$lib/i18n/th';

	let { data, children } = $props();
</script>

<AppHeader profile={data.profile} demoMode={data.demoMode} cautionBadge={data.cautionBadge} />

{#if data.demoMode}
	<p class="flex items-center justify-center gap-1.5 border-b border-brand-100 bg-brand-50 px-4 py-1.5 text-center text-xs text-brand-800" data-testid="demo-data-banner">
		<Icon name="info" size={14} />{t.demoData}
	</p>
{/if}

{#if data.profile.role === 'viewer'}
	<div class="mx-auto mt-4 max-w-6xl px-4">
		<p class="flex items-start gap-2 rounded-xl border border-info/25 bg-info-bg px-4 py-3 text-sm text-info" data-testid="viewer-banner"><Icon name="info" size={18} class="mt-0.5" />{t.auth.viewerBanner}</p>
	</div>
{/if}

<Flash flash={data.flash} />

<div class="mx-auto max-w-6xl px-4 py-6 sm:py-8">
	{@render children()}
</div>
