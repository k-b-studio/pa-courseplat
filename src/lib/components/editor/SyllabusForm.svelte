<script lang="ts">
	import Donut from '$lib/components/Donut.svelte';
	import { parseCitation } from '$lib/domain/citation';
	import { personName, t } from '$lib/i18n/th';
	import { AI_POLICIES, DELIVERY_MODES, EVAL_TYPES, GRADING_SCHEMES, LANGUAGES, PLO_CODES, READING_TYPES, REFERENCING, TEACHING_METHODS, WORK_TYPES, emptyWeek, nextId, type SyllabusDoc } from '$lib/schema/syllabus';
	import type { Snippet } from 'svelte';
	import EditorCard from './EditorCard.svelte';
	import TagInput from './TagInput.svelte';
	import type { FormCtx, SectionMeta } from './types';

	/**
	 * The nine sections as one form (spec 05 R3–R4). Reused by the AI review screen (P4), which passes
	 * `meta` (confidence + evidence) and the AI-suggestion flags.
	 */
	let {
		doc = $bindable(),
		ctx,
		issues = {},
		meta,
		aiPlo = $bindable([]),
		aiWeeks = $bindable([]),
		sectionsSlot,
		confidence,
		markers = {},
		onmarker
	}: {
		doc: SyllabusDoc;
		ctx: FormCtx;
		issues?: Record<string, number>;
		meta?: SectionMeta;
		aiPlo?: string[];
		aiWeeks?: number[];
		sectionsSlot?: Snippet;
		confidence?: Snippet<[keyof SectionMeta]>;
		markers?: Record<string, { count: number; worst: 'high' | 'medium'; id: string }>;
		onmarker?: (cautionId: string) => void;
	} = $props();

	const weeks = $derived(Array.from({ length: ctx.semester.weeks || 16 }, (_, i) => i + 1));
	const total = $derived(doc.evaluation.items.reduce((s, e) => s + (Number(e.weightPercent) || 0), 0));
	const ids = (list: { id: string }[]) => list.map((x) => x.id);
	const toggle = (list: string[], v: string) => {
		const i = list.indexOf(v);
		if (i >= 0) list.splice(i, 1);
		else list.push(v);
	};
	const touchPlo = (objId: string) => (aiPlo = aiPlo.filter((x) => x !== objId));
	const touchWeek = (w: number) => (aiWeeks = aiWeeks.filter((x) => x !== w));

	function addObjective() {
		doc.objectives.push({ id: nextId(ids(doc.objectives), 'clo'), text: '', ploCodes: doc.objectives.length === 0 ? PLO_CODES.filter((p) => ctx.suggestedPlos.includes(p) && p.endsWith('D')) : [] });
	}
	function fill16() {
		for (const w of weeks) {
			if (doc.weeklyPlan.some((x) => x.week === w)) continue;
			const row = emptyWeek(w);
			if (w === 8) Object.assign(row, { topic: t.editor.midterm, noClass: true });
			doc.weeklyPlan.push(row);
		}
		doc.weeklyPlan.sort((a, b) => a.week - b.week);
	}
	function addWeek() {
		const next = Math.max(0, ...doc.weeklyPlan.map((w) => w.week)) + 1;
		doc.weeklyPlan.push(emptyWeek(Math.min(next, weeks.length)));
	}
	function addEval() {
		doc.evaluation.items.push({ id: nextId(ids(doc.evaluation.items), 'e'), title: '', type: 'other', weightPercent: 0, individual: true, dueWeek: null, description: '' });
	}
	function addReading() {
		doc.resources.readings.push({ id: nextId(ids(doc.resources.readings), 'r'), citation: '', title: '', authors: '', year: null, type: 'book', required: true, url: null, isbn: null, doi: null });
	}
	function parseInto(i: number) {
		const r = doc.resources.readings[i];
		const p = parseCitation(r.citation);
		Object.assign(r, { title: p.title || r.title, authors: p.authors || r.authors, year: p.year ?? r.year, type: p.type === 'other' ? r.type : p.type, doi: p.doi ?? r.doi, isbn: p.isbn ?? r.isbn, url: p.url ?? r.url });
	}
	function removeReading(i: number) {
		const id = doc.resources.readings[i].id;
		doc.resources.readings.splice(i, 1);
		for (const w of doc.weeklyPlan) w.readingIds = w.readingIds.filter((x) => x !== id);
	}
	function removeEval(i: number) {
		const id = doc.evaluation.items[i].id;
		doc.evaluation.items.splice(i, 1);
		for (const w of doc.work) if (w.evaluationItemId === id) w.evaluationItemId = null;
	}
	function addWork() {
		doc.work.push({ id: nextId(ids(doc.work), 'w'), title: '', type: 'paper', description: '', deliverable: '', individual: true, groupSize: null, dueWeek: null, evaluationItemId: null, estimatedHours: null });
	}
	const tone = (k: keyof SectionMeta) => (meta?.[k] && (meta[k]!.confidence === 'low' || meta[k]!.confidence === 'not_found') ? 'warn' : undefined);
	const numOrNull = (v: string) => (v === '' ? null : Number(v));
	const strOrNull = (v: string) => (v.trim() === '' ? null : v.trim());
</script>

{#snippet confidenceChip(key: keyof SectionMeta)}{@render confidence?.(key)}{/snippet}
{#snippet marker(ref: string)}
	{#if markers[ref]}
		<button type="button" class="inline-flex items-center gap-1 rounded-full px-2 text-xs font-medium {markers[ref].worst === 'high' ? 'bg-danger-bg text-danger-ink' : 'bg-warning-bg text-warning-ink'}" onclick={() => onmarker?.(markers[ref].id)} title={t.cautions.markerTitle(markers[ref].count)} data-testid="caution-marker" data-ref={ref}>
			<span class="size-2 rounded-full {markers[ref].worst === 'high' ? 'bg-danger' : 'bg-warning'}"></span>{markers[ref].count}
		</button>
	{/if}
{/snippet}

<div class="grid gap-4" data-testid="syllabus-form">
	<!-- 1 Course Overview -->
	<EditorCard id="overview" th={t.sections.overview.th} en={t.sections.overview.en} issues={issues.overview} tone={tone('overview')}>
		{#snippet badge()}{@render confidenceChip('overview')}{/snippet}
		<div class="rounded-lg bg-page p-3 text-sm">
			<p class="font-medium">{ctx.course.code} {ctx.course.name_th} · {ctx.course.credit_format}</p>
			{#if ctx.course.description_th}<p class="mt-1 text-ink-muted">{ctx.course.description_th}</p>{/if}
			<p class="mt-1 text-xs text-ink-muted">{t.editor.catalogNote}</p>
		</div>
		<label class="grid gap-1" for="f-focus">
			<span class="label">{t.course.focus}</span>
			<textarea id="f-focus" class="input" rows="3" bind:value={doc.overview.focus} placeholder={t.editor.focusHint}></textarea>
			<span class="text-xs {doc.overview.focus.trim().length < 40 ? 'text-danger-ink' : 'text-ink-muted'}">{doc.overview.focus.trim().length}/40+</span>
		</label>
		<div class="grid gap-3 sm:grid-cols-3">
			<label class="grid gap-1"><span class="label">{t.editor.language}</span><select class="input" bind:value={doc.overview.language}>{#each LANGUAGES as l (l)}<option value={l}>{t.language[l]}</option>{/each}</select></label>
			<label class="grid gap-1"><span class="label">{t.editor.delivery}</span><select class="input" bind:value={doc.overview.deliveryMode}>{#each DELIVERY_MODES as m (m)}<option value={m}>{t.deliveryMode[m]}</option>{/each}</select></label>
			<label class="grid gap-1"><span class="label">{t.editor.hours}</span><input class="input" type="number" min="0" max="60" value={doc.overview.workloadHoursPerWeek ?? ''} oninput={(e) => (doc.overview.workloadHoursPerWeek = numOrNull(e.currentTarget.value))} /></label>
		</div>
		<TagInput id="f-keywords" bind:tags={doc.overview.keywords} label={t.editor.keywords} max={10} />
		<label class="grid gap-1"><span class="label">{t.editor.prerequisiteNote}</span><input class="input" bind:value={doc.overview.prerequisiteNote} /></label>
	</EditorCard>

	<!-- 2 Objectives -->
	<EditorCard id="objectives" th={t.sections.objectives.th} en={t.sections.objectives.en} issues={issues.objectives} tone={tone('objectives')}>
		{#snippet badge()}{@render confidenceChip('objectives')}{/snippet}
		{#each doc.objectives as o, i (o.id)}
			<div class="grid gap-2 rounded-lg border border-line p-3" id="f-objectives-{i}" data-testid="objective-row">
				<div class="flex items-center justify-between gap-2">
					<span class="text-sm font-semibold">{t.editor.objective(i + 1)}</span>
					<button type="button" class="btn btn-ghost text-sm" onclick={() => doc.objectives.splice(i, 1)}>{t.editor.remove}</button>
				</div>
				<textarea class="input" rows="2" bind:value={o.text} aria-label={t.editor.objective(i + 1)}></textarea>
				<fieldset class="grid gap-1">
					<legend class="label mb-1 flex items-center gap-2">{t.editor.plos}{#if aiPlo.includes(o.id)}<span class="chip bg-info-bg text-info" data-testid="ai-suggestion">{t.editor.aiSuggestion}</span>{/if}</legend>
					<div class="flex flex-wrap gap-1.5">
						{#each PLO_CODES as code (code)}
							<button
								type="button"
								class="chip border {o.ploCodes.includes(code) ? 'border-accent bg-accent text-white' : 'border-line bg-surface'}"
								title={ctx.plos[code]}
								aria-pressed={o.ploCodes.includes(code)}
								onclick={() => {
									toggle(o.ploCodes, code);
									touchPlo(o.id);
								}}
								data-plo={code}
								>{code}{#if ctx.suggestedPlos.includes(code)}<span class="ml-1 text-[10px] opacity-75">★</span>{/if}</button
							>
						{/each}
					</div>
					{#if ctx.suggestedPlos.length}<p class="text-xs text-ink-muted">★ {t.editor.suggested}</p>{/if}
					{#each o.ploCodes as code (code)}<p class="text-xs text-ink-muted"><strong>{code}</strong> {ctx.plos[code]}</p>{/each}
				</fieldset>
			</div>
		{/each}
		<button type="button" class="btn btn-secondary justify-self-start text-sm" onclick={addObjective} data-testid="add-objective">+ {t.editor.addObjective}</button>
	</EditorCard>

	<!-- 3 Classroom Approach -->
	<EditorCard id="approach" th={t.sections.approach.th} en={t.sections.approach.en} issues={issues.approach} tone={tone('approach')}>
		{#snippet badge()}{@render confidenceChip('approach')}{/snippet}
		<div class="flex flex-wrap gap-1.5" role="group" aria-label={t.course.methods}>
			{#each TEACHING_METHODS as m (m)}
				<button type="button" class="chip border {doc.approach.methods.includes(m) ? 'border-accent bg-accent text-white' : 'border-line bg-surface'}" aria-pressed={doc.approach.methods.includes(m)} onclick={() => toggle(doc.approach.methods, m)}>{t.teachingMethods[m]}</button>
			{/each}
		</div>
		<label class="grid gap-1"><span class="label">{t.editor.description}</span><textarea class="input" rows="3" bind:value={doc.approach.description}></textarea></label>
		<label class="grid gap-1"><span class="label">{t.editor.attendance}</span><textarea class="input" rows="2" bind:value={doc.approach.attendancePolicy}></textarea></label>
		<div class="grid gap-3 sm:grid-cols-[14rem_1fr]">
			<label class="grid gap-1"><span class="label">{t.editor.aiPolicy}</span><select class="input" bind:value={doc.approach.aiPolicy}>{#each AI_POLICIES as p (p)}<option value={p}>{t.aiPolicy[p]}</option>{/each}</select></label>
			<label class="grid gap-1"><span class="label">{t.editor.aiNote}</span><input class="input" bind:value={doc.approach.aiPolicyNote} /></label>
		</div>
		<label class="grid gap-1"><span class="label">{t.editor.lateWork}</span><textarea class="input" rows="2" bind:value={doc.approach.lateWorkPolicy}></textarea></label>
	</EditorCard>

	<!-- 4 Evaluation -->
	<EditorCard id="evaluation" th={t.sections.evaluation.th} en={t.sections.evaluation.en} issues={issues.evaluation} tone={tone('evaluation')}>
		{#snippet badge()}{@render confidenceChip('evaluation')}{/snippet}
		<div class="grid gap-3 sm:grid-cols-2">
			<label class="grid gap-1"><span class="label">{t.editor.gradingScheme}</span><select class="input" bind:value={doc.evaluation.gradingScheme}>{#each GRADING_SCHEMES as g (g)}<option value={g}>{t.gradingScheme[g]}</option>{/each}</select></label>
			<label class="grid gap-1"><span class="label">{t.editor.referencing}</span><select class="input" bind:value={doc.evaluation.referencing}>{#each REFERENCING as r (r)}<option value={r}>{t.referencing[r]}</option>{/each}</select></label>
		</div>
		{#each doc.evaluation.items as e, i (e.id)}
			<div class="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-[1fr_10rem_6rem]" id="f-evaluation-{i}" data-testid="eval-row">
				<input class="input" bind:value={e.title} placeholder={t.course.item} aria-label={t.course.item} />
				<select class="input" bind:value={e.type} aria-label={t.course.type}>{#each EVAL_TYPES as ty (ty)}<option value={ty}>{t.evalTypes[ty]}</option>{/each}</select>
				<input class="input" type="number" min="0" max="100" step="0.5" value={e.weightPercent} oninput={(ev) => (e.weightPercent = Number(ev.currentTarget.value) || 0)} aria-label={t.editor.weight} data-testid="eval-weight" />
				<div class="flex flex-wrap items-center gap-3 sm:col-span-3">
					<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={e.individual} />{t.editor.individual}</label>
					<label class="flex items-center gap-2 text-sm">{t.editor.dueWeek}
						<select class="input w-28 py-1" value={e.dueWeek ?? ''} onchange={(ev) => (e.dueWeek = numOrNull(ev.currentTarget.value))}><option value="">{t.editor.none}</option>{#each weeks as w (w)}<option value={w}>{w}</option>{/each}</select>
					</label>
					<button type="button" class="btn btn-ghost ml-auto text-sm" onclick={() => removeEval(i)}>{t.editor.remove}</button>
				</div>
				<input class="input sm:col-span-3" bind:value={e.description} placeholder={t.editor.description} aria-label={t.editor.description} />
			</div>
		{/each}
		<div class="flex flex-wrap items-center justify-between gap-3">
			<button type="button" class="btn btn-secondary text-sm" onclick={addEval} data-testid="add-eval">+ {t.editor.addEval}</button>
			{#if doc.evaluation.gradingScheme === 'letter'}
				<p class="font-semibold {total === 100 ? 'text-success' : 'text-danger-ink'}" data-testid="eval-total" aria-live="polite">{total === 100 ? t.editor.total(total) : `${t.editor.total(total)} — ${t.editor.totalMust}`}</p>
			{/if}
		</div>
		{#if doc.evaluation.items.length && doc.evaluation.gradingScheme === 'letter'}<div class="justify-self-center"><Donut items={doc.evaluation.items} size={110} /></div>{/if}
		{#if doc.evaluation.gradingScheme === 'letter'}
			<fieldset>
				<legend class="label">{t.editor.cutoffs}</legend>
				<div class="mt-1 grid grid-cols-4 gap-2 sm:grid-cols-8">
					{#each doc.evaluation.cutoffs as c (c.grade)}
						<label class="grid gap-0.5 text-center text-sm"><span class="font-semibold">{c.grade}</span><input class="input px-1 text-center" type="number" min="0" max="100" value={c.minPercent} oninput={(ev) => (c.minPercent = Number(ev.currentTarget.value) || 0)} /></label>
					{/each}
				</div>
			</fieldset>
		{/if}
	</EditorCard>

	<!-- 5 Class Resources -->
	<EditorCard id="resources" th={t.sections.resources.th} en={t.sections.resources.en} issues={issues.resources} tone={tone('resources')}>
		{#snippet badge()}{@render confidenceChip('resources')}{/snippet}
		{#each doc.resources.readings as r, i (r.id)}
			<div class="grid gap-2 rounded-lg border border-line p-3" id="f-resources-{i}" data-testid="reading-row">
				<label class="grid gap-1"><span class="label">{t.editor.citation}</span><textarea class="input" rows="2" bind:value={r.citation}></textarea></label>
				<div class="flex flex-wrap gap-2">
					<button type="button" class="btn btn-ghost text-sm" onclick={() => parseInto(i)} disabled={!r.citation.trim()}>{t.editor.parseCitation}</button>
					<label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={r.required} />{t.editor.required}</label>
					{@render marker(`readings:${r.id}`)}
					<button type="button" class="btn btn-ghost ml-auto text-sm" onclick={() => removeReading(i)}>{t.editor.remove}</button>
				</div>
				<div class="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_8rem]">
					<input class="input" bind:value={r.title} placeholder={t.editor.title} aria-label={t.editor.title} />
					<input class="input" bind:value={r.authors} placeholder={t.editor.authors} aria-label={t.editor.authors} />
					<input class="input" type="number" value={r.year ?? ''} oninput={(ev) => (r.year = numOrNull(ev.currentTarget.value))} placeholder={t.editor.year} aria-label={t.editor.year} />
					<select class="input" bind:value={r.type} aria-label={t.editor.type}>{#each READING_TYPES as ty (ty)}<option value={ty}>{t.readingTypes[ty]}</option>{/each}</select>
				</div>
				<div class="grid gap-2 sm:grid-cols-3">
					<input class="input" value={r.url ?? ''} oninput={(ev) => (r.url = strOrNull(ev.currentTarget.value))} placeholder="URL" aria-label="URL" />
					<input class="input" value={r.isbn ?? ''} oninput={(ev) => (r.isbn = strOrNull(ev.currentTarget.value))} placeholder="ISBN" aria-label="ISBN" />
					<input class="input" value={r.doi ?? ''} oninput={(ev) => (r.doi = strOrNull(ev.currentTarget.value))} placeholder="DOI" aria-label="DOI" />
				</div>
			</div>
		{/each}
		<button type="button" class="btn btn-secondary justify-self-start text-sm" onclick={addReading}>+ {t.editor.addReading}</button>
		<label class="grid gap-1"><span class="label">{t.editor.materials}</span>
			<textarea class="input" rows="2" value={doc.resources.materials.join('\n')} oninput={(ev) => (doc.resources.materials = ev.currentTarget.value.split('\n').map((x) => x.trim()).filter(Boolean))}></textarea>
		</label>
		<div class="grid gap-2">
			<span class="label">{t.editor.platforms}</span>
			{#each doc.resources.platforms as p, i (i)}
				<div class="grid gap-2 sm:grid-cols-[10rem_1fr_1fr_auto]">
					<input class="input" bind:value={p.name} placeholder={t.editor.name} aria-label={t.editor.name} />
					<input class="input" value={p.url ?? ''} oninput={(ev) => (p.url = strOrNull(ev.currentTarget.value))} placeholder="URL" aria-label="URL" />
					<input class="input" bind:value={p.note} placeholder={t.editor.note} aria-label={t.editor.note} />
					<button type="button" class="btn btn-ghost text-sm" onclick={() => doc.resources.platforms.splice(i, 1)}>{t.editor.remove}</button>
				</div>
			{/each}
			<button type="button" class="btn btn-ghost justify-self-start text-sm" onclick={() => doc.resources.platforms.push({ name: '', url: null, note: '' })}>+ {t.editor.addPlatform}</button>
		</div>
	</EditorCard>

	<!-- 6 Work (optional) -->
	<EditorCard id="work" th={t.sections.work.th} en={t.sections.work.en} issues={issues.work} tone={tone('work')} open={doc.work.length > 0}>
		{#snippet badge()}{@render confidenceChip('work')}{/snippet}
		<p class="text-xs text-ink-muted">{t.editor.workOptional}</p>
		{#each doc.work as w, i (w.id)}
			<div class="grid gap-2 rounded-lg border border-line p-3" id="f-work-{i}" data-testid="work-row">
				{@render marker(`work:${w.id}`)}
				<div class="grid gap-2 sm:grid-cols-[1fr_12rem]">
					<input class="input" bind:value={w.title} placeholder={t.editor.title} aria-label={t.editor.title} />
					<select class="input" bind:value={w.type} aria-label={t.editor.type}>{#each WORK_TYPES as ty (ty)}<option value={ty}>{t.workTypes[ty]}</option>{/each}</select>
				</div>
				<textarea class="input" rows="2" bind:value={w.description} placeholder={t.editor.description} aria-label={t.editor.description}></textarea>
				<input class="input" bind:value={w.deliverable} placeholder={t.editor.deliverable} aria-label={t.editor.deliverable} />
				<div class="flex flex-wrap items-center gap-3 text-sm">
					<label class="flex items-center gap-2"><input type="checkbox" checked={w.individual} onchange={(ev) => ((w.individual = ev.currentTarget.checked), (w.groupSize = w.individual ? null : w.groupSize))} />{t.editor.individual}</label>
					{#if !w.individual}<input class="input w-28 py-1" value={w.groupSize ?? ''} oninput={(ev) => (w.groupSize = strOrNull(ev.currentTarget.value))} placeholder={t.editor.groupSize} aria-label={t.editor.groupSize} />{/if}
					<label class="flex items-center gap-2">{t.editor.dueWeek}<select class="input w-24 py-1" value={w.dueWeek ?? ''} onchange={(ev) => (w.dueWeek = numOrNull(ev.currentTarget.value))}><option value="">{t.editor.none}</option>{#each weeks as n (n)}<option value={n}>{n}</option>{/each}</select></label>
					<label class="flex items-center gap-2">{t.editor.evalLink}<select class="input w-44 py-1" value={w.evaluationItemId ?? ''} onchange={(ev) => (w.evaluationItemId = strOrNull(ev.currentTarget.value))}><option value="">{t.editor.none}</option>{#each doc.evaluation.items as e (e.id)}<option value={e.id}>{e.title || e.id}</option>{/each}</select></label>
					<label class="flex items-center gap-2">{t.editor.estimatedHours}<input class="input w-20 py-1" type="number" min="0" value={w.estimatedHours ?? ''} oninput={(ev) => (w.estimatedHours = numOrNull(ev.currentTarget.value))} /></label>
					<button type="button" class="btn btn-ghost ml-auto" onclick={() => doc.work.splice(i, 1)}>{t.editor.remove}</button>
				</div>
			</div>
		{/each}
		<button type="button" class="btn btn-secondary justify-self-start text-sm" onclick={addWork}>+ {t.editor.addWork}</button>
	</EditorCard>

	<!-- 7 Professor (Section): assigned by staff; read-only here -->
	<EditorCard id="professors" th={t.sections.professors.th} en={t.sections.professors.en}>
		<p class="text-sm text-ink-muted">{t.editor.professorsNote}</p>
		<ul class="grid gap-1 text-sm">
			{#each ctx.sections as s (s.id)}<li><strong>{t.common.sectionN(s.section_no)}</strong>: {s.instructors.map((p) => personName(p)).join(', ')}</li>{/each}
		</ul>
	</EditorCard>

	<!-- 8 Timetable: weekly plan + key dates -->
	<EditorCard id="timetable" th={t.sections.timetable.th} en={t.sections.timetable.en} issues={issues.timetable} tone={tone('weeklyPlan')}>
		{#snippet badge()}{@render confidenceChip('weeklyPlan')}{/snippet}
		<div class="flex flex-wrap gap-2">
			<button type="button" class="btn btn-secondary text-sm" onclick={fill16} data-testid="fill-16">{t.editor.fill16}</button>
			<button type="button" class="btn btn-ghost text-sm" onclick={addWeek}>+ {t.editor.addWeek}</button>
		</div>
		{#each doc.weeklyPlan as w, i (i)}
			<div class="grid gap-2 rounded-lg border p-3 {w.noClass ? 'border-warning/40 bg-warning-bg/40' : 'border-line'}" id="f-weeklyPlan-{i}" data-testid="week-row" data-week={w.week}>
				<div class="flex flex-wrap items-center gap-2">
					<label class="flex items-center gap-1 text-sm font-semibold">{t.editor.week}<input class="input w-16 px-2 py-1" type="number" min="1" max={weeks.length} value={w.week} oninput={(ev) => (w.week = Number(ev.currentTarget.value) || w.week)} /></label>
					<label class="flex items-center gap-1.5 text-sm"><input type="checkbox" bind:checked={w.noClass} />{t.editor.noClass}</label>
					{@render marker(`weeklyPlan:${w.week}`)}
					<button type="button" class="btn btn-ghost ml-auto text-sm" onclick={() => doc.weeklyPlan.splice(i, 1)}>{t.editor.remove}</button>
				</div>
				<input class="input" bind:value={w.topic} placeholder={t.editor.topic} aria-label="{t.editor.topic} {w.week}" />
				{#if !w.noClass}
					<textarea class="input" rows="1" bind:value={w.details} placeholder={t.editor.details} aria-label={t.editor.details}></textarea>
					<TagInput bind:tags={w.concepts} label={t.editor.concepts} max={8} />
					<div class="grid gap-1">
						<span class="label flex items-center gap-2">{t.editor.instructors}{#if aiWeeks.includes(w.week)}<span class="chip bg-info-bg text-info">{t.editor.aiSuggestion}</span>{/if}</span>
						<div class="flex flex-wrap gap-1.5">
							{#each ctx.instructors.filter((p) => p.id) as p (p.id)}
								<button type="button" class="chip border {w.instructorIds.includes(p.id!) ? 'border-accent bg-accent text-white' : 'border-line bg-surface'}" aria-pressed={w.instructorIds.includes(p.id!)} onclick={() => (toggle(w.instructorIds, p.id!), touchWeek(w.week))}>{personName(p)}</button>
							{/each}
						</div>
					</div>
					{#if doc.resources.readings.length}
						<div class="grid gap-1">
							<span class="label">{t.editor.readings}</span>
							<div class="flex flex-wrap gap-1.5">
								{#each doc.resources.readings as r (r.id)}
									<button type="button" class="chip max-w-full truncate border {w.readingIds.includes(r.id) ? 'border-accent bg-accent text-white' : 'border-line bg-surface'}" aria-pressed={w.readingIds.includes(r.id)} onclick={() => toggle(w.readingIds, r.id)}>{r.title || r.citation.slice(0, 40) || r.id}</button>
								{/each}
							</div>
						</div>
					{/if}
					<input class="input" bind:value={w.activity} placeholder={t.editor.activity} aria-label={t.editor.activity} />
				{/if}
			</div>
		{/each}
		<div class="grid gap-2 border-t border-line pt-4">
			<span class="label">{t.editor.keyDates}</span>
			{#each doc.keyDates as k, i (i)}
				<div class="grid gap-2 sm:grid-cols-[1fr_8rem_10rem_auto]">
					<input class="input" bind:value={k.label} placeholder={t.editor.label} aria-label={t.editor.label} />
					<select class="input" value={k.week ?? ''} onchange={(ev) => (k.week = numOrNull(ev.currentTarget.value))} aria-label={t.editor.week}><option value="">{t.editor.none}</option>{#each weeks as n (n)}<option value={n}>{t.common.weekN(n)}</option>{/each}</select>
					<input class="input" type="date" value={k.date ?? ''} oninput={(ev) => (k.date = strOrNull(ev.currentTarget.value))} aria-label={t.editor.date} />
					<button type="button" class="btn btn-ghost text-sm" onclick={() => doc.keyDates.splice(i, 1)}>{t.editor.remove}</button>
				</div>
			{/each}
			<button type="button" class="btn btn-ghost justify-self-start text-sm" onclick={() => doc.keyDates.push({ label: '', week: null, date: null })}>+ {t.editor.addKeyDate}</button>
		</div>
	</EditorCard>

	<!-- 9 Section: note and meeting times (instructors of that section, spec 05 R9) -->
	<EditorCard id="sections" th={t.sections.sections.th} en={t.sections.sections.en}>
		<p class="text-sm text-ink-muted">{t.editor.sectionsNote}</p>
		{@render sectionsSlot?.()}
	</EditorCard>
</div>
