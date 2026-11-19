<script lang="ts">
	import { DEMO_BUTTONS } from '$lib/domain/accounts';
	import { t } from '$lib/i18n/th';

	let { data, form } = $props();
</script>

<main class="mx-auto max-w-3xl px-4 py-10 sm:py-16">
	{#if data.demoMode}
		<p class="chip">{t.demoData}</p>
	{/if}
	<h1 class="mt-4 text-3xl font-semibold text-accent-dark sm:text-4xl">{t.appName}</h1>
	<p class="mt-1 text-lg text-ink">{t.appNameTh}</p>
	<p class="mt-4 max-w-2xl text-ink-muted">{t.auth.landingLead}</p>

	<section class="card mt-8 p-5 sm:p-6" aria-labelledby="signin-title">
		<h2 id="signin-title" class="sr-only">{t.auth.signInChula}</h2>
		<form method="POST" action="?/google">
			<button class="btn btn-primary w-full sm:w-auto" type="submit">{t.auth.signInChula}</button>
		</form>
		<p class="mt-3 text-sm text-ink-muted">{t.auth.signInHint}</p>
		{#if form?.error}
			<p class="mt-3 text-sm text-danger-ink" role="alert">{t.auth.genericError}</p>
		{/if}
	</section>

	{#if data.demoMode}
		<section class="card mt-6 p-5 sm:p-6" aria-labelledby="demo-title" data-testid="demo-panel">
			<h2 id="demo-title" class="text-lg font-semibold">{t.auth.demoPanel}</h2>
			<p class="mt-1 text-sm text-ink-muted">{t.auth.demoPanelHint}</p>
			<div class="mt-4 grid gap-3 sm:grid-cols-2">
				{#each DEMO_BUTTONS as b (b.key)}
					<form method="POST" action="/auth/demo">
						<input type="hidden" name="key" value={b.key} />
						<button class="btn btn-secondary flex w-full flex-col items-start text-left" type="submit" data-demo={b.key}>
							<span class="font-medium">{b.label}</span>
							<span class="text-xs text-ink-muted">{t.roles[b.role]}</span>
						</button>
					</form>
				{/each}
			</div>
		</section>
	{/if}
</main>
