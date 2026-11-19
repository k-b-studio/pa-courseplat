<script lang="ts">
	import { t } from '$lib/i18n/th';

	let { form } = $props();
	const majors = ['PA', 'GOV', 'IR', 'SOC'] as const;
</script>

<section class="mx-auto max-w-lg">
	<h1 class="text-3xl font-semibold tracking-tight">{t.onboarding.title}</h1>
	<p class="mt-2 text-ink-muted">{t.onboarding.lead}</p>
	<form method="POST" class="card mt-6 p-5">
		<fieldset>
			<legend class="sr-only">{t.profile.major}</legend>
			<div class="grid gap-2">
				{#each majors as m (m)}
					<label class="flex items-center gap-3 rounded-lg border border-line px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-light">
						<input type="radio" name="major" value={m} checked={m === 'PA'} />
						<span>{t.majors[m]}</span>
					</label>
				{/each}
			</div>
		</fieldset>
		{#if form?.error}
			<p class="mt-3 text-sm text-danger-ink" role="alert">{t.common.error}</p>
		{/if}
		<button class="btn btn-primary mt-5 w-full" type="submit">{t.onboarding.save}</button>
	</form>
</section>
