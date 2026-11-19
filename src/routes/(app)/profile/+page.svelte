<script lang="ts">
	import { t } from '$lib/i18n/th';

	let { data, form } = $props();
	const p = $derived(data.profile);
	const majors = ['PA', 'GOV', 'IR', 'SOC'] as const;
	const fields = [
		['title_th', t.profile.titleTh],
		['name_th', t.profile.nameTh],
		['name_en', t.profile.nameEn],
		['office', t.profile.office],
		['office_hours', t.profile.officeHours]
	] as const;
</script>

<section class="mx-auto max-w-xl">
	<h1 class="text-2xl font-semibold">{t.profile.title}</h1>
	<dl class="card mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 p-5 text-sm">
		<dt class="text-ink-muted">{t.profile.email}</dt>
		<dd class="break-all">{p.email}</dd>
		<dt class="text-ink-muted">{t.profile.role}</dt>
		<dd>{t.roles[p.role]}</dd>
		{#if p.role === 'student' && p.cohort != null}
			<dt class="text-ink-muted">{t.profile.cohort}</dt>
			<dd>{p.cohort}</dd>
		{/if}
	</dl>

	<form method="POST" class="card mt-4 grid gap-4 p-5">
		{#if p.role === 'student'}
			<label class="grid gap-1">
				<span class="label">{t.profile.major}</span>
				<select class="input" name="major" value={p.major ?? 'PA'}>
					{#each majors as m (m)}<option value={m}>{t.majors[m]}</option>{/each}
				</select>
			</label>
		{:else}
			{#each fields as [name, label] (name)}
				<label class="grid gap-1">
					<span class="label">{label}</span>
					<input class="input" {name} value={p[name] ?? ''} maxlength="200" />
				</label>
			{/each}
			<label class="grid gap-1">
				<span class="label">{t.profile.contactNote}</span>
				<textarea class="input" name="contact_note" rows="2" maxlength="500">{p.contact_note ?? ''}</textarea>
				<span class="text-xs text-ink-muted">{t.profile.contactHint}</span>
			</label>
		{/if}
		{#if form?.error}<p class="text-sm text-danger-ink" role="alert">{t.common.error}</p>{/if}
		<button class="btn btn-primary justify-self-start" type="submit">{t.common.save}</button>
	</form>
</section>
