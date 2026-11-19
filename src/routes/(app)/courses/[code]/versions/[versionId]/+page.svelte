<script lang="ts">
	import CourseHeader from '$lib/components/CourseHeader.svelte';
	import RelatedCourses from '$lib/components/RelatedCourses.svelte';
	import SyllabusView from '$lib/components/syllabus/SyllabusView.svelte';
	import { t } from '$lib/i18n/th';

	let { data } = $props();
</script>

<div class="grid grid-cols-1 gap-5">
	<CourseHeader course={data.course} semesterLabel={data.semester.label} badges={data.badges} editedAt={data.publishedAt} />
	<p class="rounded-lg border border-line-strong bg-surface px-4 py-2 text-sm" data-testid="version-note">{t.course.pastVersionNote(data.semester.label)}</p>
	<SyllabusView ctx={{ doc: data.doc, course: data.course, semester: data.semester, sections: data.sections, instructors: data.instructors, plos: data.plos }}>
		{#snippet after()}<RelatedCourses related={data.related} past={data.past} code={data.course.code} />{/snippet}
	</SyllabusView>
</div>
