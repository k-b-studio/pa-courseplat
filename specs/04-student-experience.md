# 04 — Student experience: browse, course page, compare, curriculum map

## Goal

A PolSci student can find a PA course for the coming semester, understand what it involves in about 30 seconds, check whether it is required for them, and compare it with alternatives, including how the workload of the courses they plan to take piles up week by week. This is the "opportunity cost" and "understand the course before it starts" half of the brief.

## Requirements

- R1. **Course list** `/courses`
  - Semester switcher. Default: the `upcoming` semester if it has at least one published offering, otherwise the `active` one. Archived semesters are reachable.
  - Filters, combinable: my status (บังคับคณะ / บังคับสาขา / วิชาเลือกกลุ่ม / วิชาเลือก), track (สายบริหารงานคลัง / สายบริหารงานบุคคล / สายนโยบายและการวางแผน), course level (ชั้นปี 2 / 3 / 4, from the 5th digit of the code), weekday, language, "มีประมวลรายวิชาแล้ว" (published only, on by default), text search on code, Thai name, English name and keywords.
  - Card per offering: code, Thai name (English name smaller), credit format, status badge for this student, sections count and first meeting time, instructors' short names, evaluation mini-bar, hours per week, publication state.
  - Offerings that are `draft` or `not_started` appear only when the published-only filter is off, greyed, with "ยังไม่เผยแพร่ประมวลรายวิชา" and a link to the last published semester of that course if one exists.
  - Each card has an "เพิ่มเพื่อเปรียบเทียบ" toggle (max 3) feeding a sticky compare tray.
- R2. **Course page** `/courses/[code]` (redirects to the default semester's offering) and `/courses/[code]/[semesterId]`
  - Header: code, names, credit format, badges for this student's curriculum and major, prerequisite chips (link to those courses), semester label, "แก้ไขล่าสุด" date, demo-data badge in demo mode.
  - **At a glance** card (above the fold on a phone): hours per week, evaluation donut with the top three items, teaching-method chips, language, delivery mode, sections and meeting times, midterm/final from key dates, AI-use policy chip.
  - The nine sections from spec 01, in this order, each an anchored block with a sticky section nav (side nav on desktop, horizontal scroll chips on mobile): Course Overview, Objectives, Classroom Approach, Evaluation, Class Resources, Work, Professor (Section), Timetable, Section. Section titles show Thai first with the English name the brief used, e.g. "ภาพรวมรายวิชา · Course Overview".
  - Course Overview shows the official description (catalog, Thai then English, labelled "คำอธิบายรายวิชาตามหลักสูตร") and, separately, "จุดเน้นภาคการศึกษานี้" (`overview.focus`).
  - Objectives: each CLO with PLO chips; tapping a chip shows the PLO's Thai text.
  - Evaluation: donut plus a table (item, type, weight, individual/group, due week). S/U courses show "ประเมินผลแบบ S/U" instead of the donut.
  - Class Resources: required and recommended readings as separate lists with full citations and links; platforms with links.
  - Work: hidden entirely when `work` is empty (the brief marks it optional).
  - Professor (Section): one card per instructor: title + name, contact note, office hours, the sections they teach, and the weeks they lead (derived from `weeklyPlan[].instructorIds`).
  - Timetable: (a) a weekly grid of meetings per section; (b) the week-by-week plan with computed dates (`semester.starts_on` + week), topic, concepts, instructor initials, linked readings, activity; exam and no-class weeks shaded; (c) key dates.
  - Section: table of sections with number, language, capacity, instructors, meetings, notes.
  - **Related courses** panel at the end, built from the catalog only: prerequisites of this course ("ต้องเรียนก่อน") and courses that list this one as a prerequisite ("เป็นพื้นฐานของ"). Content Caution is for professors and staff only (spec 06), so student pages never read caution tables and never show anything derived from them: no overlap lists, counts, relation labels or similarity scores.
  - "ภาคการศึกษาก่อนหน้า" link list: past published versions of this course (read-only rendering of the `offering_versions` snapshot).
- R3. **Compare** `/compare?o=<offeringId>,<offeringId>[,<offeringId>]`
  - Columns per offering, rows aligned by section: at a glance, objectives (with PLO chips), approach, evaluation (bars on a shared 0–100 scale), workload, work items, readings (shared readings highlighted), meetings (time clashes flagged "เวลาเรียนชนกัน").
  - **Shared topics**: concept tags or topics that appear in more than one column, highlighted in all columns. Students see the neutral label "หัวข้อที่เกี่ยวข้องกัน".
  - **Workload heatmap**: rows = the compared offerings plus a "รวม" row; columns = weeks 1–16; cell = assessed weight due that week (from `evaluation.items[].dueWeek` and `keyDates`), with a tooltip listing the items. Colour scale from neutral to strong; weeks where the total ≥ 40% get an outline and a note.
- R4. **Curriculum map** `/curriculum` (Should)
  - Matrix: rows = PA courses (catalog), columns = PLO1D–PLO5D. Each cell shows ● if the curriculum names the course as an example for that PLO (`course_plos`), and ◐ if a published CLO in the selected semester maps to it. Column footers count published offerings covering each PLO in that semester.
  - Second tab: the PA requirements for the student's curriculum (2564 or 2569) laid out as faculty core, major required and track electives, with links to each course and its status in the selected semester.
- R5. Phone first. Every page works at 375 px wide in Safari on iOS; the at-a-glance card and section nav must be usable with one thumb. Desktop uses a two-column layout from 1024 px.
- R6. Accessibility: WCAG 2.1 AA contrast; every chart has a text equivalent (the donut has its table; heatmap cells have `aria-label`s and the table view toggle); keyboard reachable section nav; `lang="th"` on the document and `lang="en"` on English runs.

## Proposed approach

### Badge logic (`src/lib/domain/curriculum.ts`, pure and unit-tested)

```
curriculumForCohort(cohort) → 'polsci-2564' (cohort ≤ 68, with notice if < 66) | 'polsci-2569'
courseStatusFor(courseCode, curriculumId, major) →
  'faculty_core'       if in curriculum_courses(category = faculty_core)
  'major_required'     if category = major_required and major matches
  'track_elective'     with track names if category = track_elective and major matches
  'required_elective'  e.g. 2404480 for PA
  'elective'           otherwise
```

Badge copy: บังคับคณะ, บังคับสาขา (PA), วิชาเลือกกลุ่ม: สายนโยบายและการวางแผน, วิชาเลือกที่ต้องเรียน (สัมมนา), วิชาเลือก. For a student whose major is not PA, PA courses read "วิชาเลือก (นอกสาขา)" unless they are faculty core. Staff and instructors see the badges for both curricula ("บังคับสาขา PA · 2564, 2569").

### Workload (`src/lib/domain/workload.ts`)

```
weeklyLoad(doc, weeks) → number[weeks]     // % weight due per week
  for each evaluation item with dueWeek: load[dueWeek] += weightPercent
  midterm/final items without dueWeek: use keyDates labelled midterm/final (week), else skip and list as "undated"
basketLoad(docs) → { rows: number[][], total: number[] }
hoursPerWeek(doc, course) → doc.overview.workloadHoursPerWeek ?? selfStudyHours(course.creditFormat)   // '3 (3-0-6)' → 6
```

Final exams usually fall after week 16; show them in a separate "ช่วงสอบปลายภาค" column.

### Data loading

- `/courses`: one server load that joins offerings (for the semester) with courses, sections, meetings, instructor names, and a projection of the syllabus doc (overview, evaluation items, approach methods). Do not ship full syllabus documents for the list.
- `/courses/[code]/[semesterId]`: full doc, sections, meetings, instructors, PLO texts for the referenced codes, related courses, past versions list.
- Related courses query: `courses.prerequisite_codes` in both directions (the catalog is readable by every signed-in user). No caution data and no extra database function.

### Visual direction

Clean and academic: off-white background, one accent colour, generous Thai line height (1.7 for Sarabun body text), Prompt for headings. Use the same palette across donut segments by evaluation type, so "exam" is the same colour on every course. Do not use the Chulalongkorn emblem or official faculty marks: this is a demo, not an official system. Footer: "ต้นแบบเพื่อการนำเสนอ — ไม่ใช่ระบบทางการของจุฬาลงกรณ์มหาวิทยาลัย".

Components to build (or copy from creditgpax and adapt): `Donut`, `Heatmap`, `Badge`, `Chip`, `SectionNav`, `CourseCard`, `CompareTray`, `syllabus/OverviewBlock`, `ObjectivesBlock`, `ApproachBlock`, `EvaluationBlock`, `ResourcesBlock`, `WorkBlock`, `ProfessorsBlock`, `TimetableBlock`, `SectionsBlock`, `RelatedCourses`. The `syllabus/*` blocks are reused unchanged by the instructor's "preview as student" (spec 05) and by past-version pages.

## Files / modules affected

`src/routes/(app)/courses/+page.server.ts`, `+page.svelte`; `src/routes/(app)/courses/[code]/+page.server.ts` (redirect); `src/routes/(app)/courses/[code]/[semesterId]/+page.server.ts`, `+page.svelte`; `src/routes/(app)/courses/[code]/versions/[versionId]/+page.*`; `src/routes/(app)/compare/+page.*`; `src/routes/(app)/curriculum/+page.*`; `src/lib/domain/curriculum.ts`, `workload.ts`, `weeks.ts`; `src/lib/components/**`.

## Acceptance criteria

1. As the demo student (cohort 67, PA): `/courses` defaults to 2/2569 and shows the published PA offerings; 2404324 shows "บังคับสาขา (PA)"; 2404429 shows "วิชาเลือกกลุ่ม: สายบริหารงานคลัง · สายนโยบายและการวางแผน" (curriculum 2564 lists it in both tracks; check `data/curriculum-pa.json`).
2. Filter "สายนโยบายและการวางแผน" lists only offerings of 2404318, 2404422, 2404429, 2404431, 2404470 that exist in that semester.
3. `/courses/2404324/2569-2` renders all nine sections; the evaluation donut segments sum to 100; week 8 is shaded as an exam week; the week-1 date equals `semesters.starts_on`.
4. `/courses/2400114/2569-2` shows two sections with different instructors, and the Professor block lists each instructor with their own section.
5. `/courses/2404412/2569-2` shows three instructors, each with the weeks they lead.
6. The Related courses panel of 2404324 lists 2404470 under "เป็นพื้นฐานของ" (2404470 requires 2404324 and 2404368), and the panel of 2404436 lists no caution-derived link even though a resolved builds-on caution with 2400114 exists.
7. Compare 2404324 + 2404429 (after the demo upload is published) highlights the shared reading by Dye and shared topics on the policy cycle, and the heatmap marks weeks 11–12.
8. Lighthouse is not required; instead, in Safari's Web Inspector Audit and in Playwright WebKit at 390×844, there are no horizontal scrollbars on `/courses`, the course page or compare, and no console errors.
9. A student cannot reach a draft through a guessed URL: `/courses/2404318/2569-2` shows the "ยังไม่เผยแพร่" state, not the draft content.

## Non-goals

Saving baskets to the server (the compare tray lives in the URL and `localStorage`), timetable export to calendar apps, ratings or reviews of courses, showing grades distributions.
