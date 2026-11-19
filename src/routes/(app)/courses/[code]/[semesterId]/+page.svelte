<script lang="ts">
	import { appPath } from '$lib/paths';
	import CourseHeader from '$lib/components/CourseHeader.svelte';
	import RelatedCourses from '$lib/components/RelatedCourses.svelte';
	import SyllabusView from '$lib/components/syllabus/SyllabusView.svelte';
	import { t } from '$lib/i18n/th';

	let { data } = $props();
</script>

<svelte:head><title>{data.course.code} {data.course.name_th} · {t.appName}</title></svelte:head>

<div class="grid grid-cols-1 gap-5">
	<CourseHeader course={data.course} semesterLabel={data.semester.label} badges={data.badges} editedAt={data.state === 'published' ? data.publishedAt : null} />

	{#if data.state === 'published'}
		<SyllabusView ctx={{ doc: data.doc, course: data.course, semester: data.semester, sections: data.sections, instructors: data.instructors, plos: data.plos }}>
			{#snippet after()}<RelatedCourses related={data.related} past={data.past} code={data.course.code} />{/snippet}
		</SyllabusView>
	{:else}
		<div class="card p-6" data-testid="not-published">
			<h2 class="text-lg font-semibold">{data.state === 'unpublished' ? t.course.notPublished : t.course.notOffered}</h2>
			{#if data.state === 'unpublished'}<p class="mt-1 text-ink-muted">{t.course.notPublishedLead}</p>{/if}
			{#if data.state === 'unpublished' && data.lastPublished}
				<a class="btn btn-secondary mt-4" href={appPath(`/courses/${data.course.code}/versions/${data.lastPublished.versionId}`)}>{t.course.lastPublished(data.lastPublished.label)}</a>
			{/if}
			{#if data.course.description_th}
				<h3 class="label mt-5">{t.course.officialDescription}</h3>
				<p class="mt-1">{data.course.description_th}</p>
			{/if}
		</div>
		<RelatedCourses related={data.related} past={data.past} code={data.course.code} />
	{/if}
</div>
