<script lang="ts">
	import { enhance } from '$app/forms';
	import { personName, t } from '$lib/i18n/th';
	import type { SectionView } from '$lib/view-types';
	import { untrack } from 'svelte';

	/** R9: an instructor edits the note and meeting times of the sections they teach (update_section_details). */
	let { section, editable }: { section: SectionView; editable: boolean } = $props();
	// a local copy to edit; the section prop is only the starting point
	let note = $state(untrack(() => section.note));
	let meetings = $state(untrack(() => section.meetings).map((m) => ({ weekday: m.weekday, startsAt: m.starts_at, endsAt: m.ends_at, room: m.room, mode: m.mode as 'onsite' | 'online' | 'hybrid' })));
	let saved = $state(false);
</script>

<div class="rounded-lg border border-line p-3" data-testid="section-details" data-section={section.section_no}>
	<p class="font-semibold">{t.common.sectionN(section.section_no)} <span class="text-sm font-normal text-ink-muted">· {section.instructors.map((p) => personName(p)).join(', ')}</span></p>
	{#if editable}
		<form
			method="POST"
			action="?/sectionDetails"
			class="mt-2 grid gap-2"
			use:enhance={() => {
				saved = false;
				return async ({ result, update }) => {
					await update({ reset: false, invalidateAll: false });
					saved = result.type === 'success';
				};
			}}
		>
			<input type="hidden" name="section" value={section.id} />
			<input type="hidden" name="meetings" value={JSON.stringify(meetings)} />
			<label class="grid gap-1"><span class="label">{t.editor.note}</span><input class="input" name="note" bind:value={note} maxlength="500" /></label>
			{#each meetings as m, i (i)}
				<div class="grid grid-cols-2 gap-2 sm:grid-cols-[8rem_6rem_6rem_1fr_7rem_auto]">
					<select class="input" bind:value={m.weekday} aria-label={t.course.weekday}>{#each [1, 2, 3, 4, 5, 6, 7] as d (d)}<option value={d}>{t.weekdays[d]}</option>{/each}</select>
					<input class="input" type="time" bind:value={m.startsAt} aria-label={t.editor.start} />
					<input class="input" type="time" bind:value={m.endsAt} aria-label={t.editor.end} />
					<input class="input" bind:value={m.room} placeholder={t.editor.room} aria-label={t.editor.room} />
					<select class="input" bind:value={m.mode} aria-label={t.editor.mode}>{#each ['onsite', 'online', 'hybrid'] as md (md)}<option value={md}>{t.deliveryMode[md]}</option>{/each}</select>
					<button type="button" class="btn btn-ghost text-sm" onclick={() => meetings.splice(i, 1)}>{t.editor.remove}</button>
				</div>
			{/each}
			<div class="flex flex-wrap items-center gap-2">
				<button type="button" class="btn btn-ghost text-sm" onclick={() => meetings.push({ weekday: 1, startsAt: '09:30', endsAt: '12:30', room: '', mode: 'onsite' })}>+ {t.editor.addMeeting}</button>
				<button class="btn btn-secondary ml-auto text-sm" type="submit">{t.editor.saveSection}</button>
				{#if saved}<span class="text-sm text-success" role="status">{t.editor.sectionSaved}</span>{/if}
			</div>
		</form>
	{:else}
		<p class="mt-1 text-sm">{section.meetings.map((m) => `${t.weekdays[m.weekday]} ${m.starts_at}–${m.ends_at}${m.room ? ` · ${m.room}` : ''}`).join(', ') || '—'}</p>
		{#if section.note}<p class="text-sm text-ink-muted">{section.note}</p>{/if}
	{/if}
</div>
