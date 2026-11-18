# data/ — real catalog data and one example syllabus

These files seed the course catalog. They are real (from official sources), unlike everything in `fixtures/`, which is fictional demo content.

| File | Contents | Source | How it was made |
|---|---|---|---|
| `courses.json` | 34 courses: all 33 undergraduate PA courses (2404xxx) open in the registrar report, plus 2400114 Introduction to Public Administration (faculty core taught by PA); and two external accounting courses used in PA track rules (2601112, 2601115) | Codes, names, short names, credits, registrar prerequisite text: creditgpax `open-course-csv/all_courses.csv` (registrar "รายวิชาที่เปิด" report, snapshot 19/06/2569, decoded from CP-874). Credit format, official descriptions, course conditions: creditgpax `curriculum/polsci-2569.pdf` (คำอธิบายรายวิชา) | `pdftotext -layout`, then parsed per course block. English descriptions are as printed (whitespace and hyphenation cleaned). See the Thai note below. |
| `curriculum-pa.json` | PA view of curricula 2564 (cohorts 66–68, 135 credits) and 2569 (cohort 69 onwards, 129 credits): faculty core codes, PA major-required codes, PA electives (three tracks; with-minor and without-minor rules) | creditgpax `src/lib/data/curricula/polsci-2564.json`, `polsci-2569.json` | Copied the PA slices unchanged |
| `plos-2569.json` | Programme learning outcomes PLO1–5 and PA-specific PLO1D–5D (Thai), the curriculum's example courses per PLO, teaching and assessment methods per PLO, and Thai labels for the controlled vocabularies used by the syllabus schema | `polsci-2569.pdf`, หมวดที่ 2 ข้อ 7 and หมวดที่ 4 ข้อ 3 | Typed from the extracted text; Thai restored as below |
| `examples/2404324-2569-2.json` | A complete, valid `SyllabusDoc` for 2404324 นโยบายสาธารณะ in 2/2569 | **Fictional** demo syllabus (the readings are real publications) | Written for the demo; the style and completeness bar for all seed syllabi |

## Thai text: read before using in production

The 2569 PDF's text layer drops Thai tone marks and the nikhahit of sara am (for example ดาน for ด้าน, ความเปน for ความเป็น). The Thai descriptions in `courses.json` and the PLO texts were restored by hand, reading each against the 2564 PDF (whose text layer keeps tone marks) and the English description. Two obvious typos in the source were corrected: 2404310 "การบริงาน" → "การบริหารงาน", and a duplicated "และการ" in 2404419. Treat these Thai texts as a careful transcription, not the official text: check them against the printed curriculum before any real use. Staff can correct them in the app (spec 07, R14).

## Known gaps

- 2404316 and 2404435 appear in the registrar report (first opened 1/2569) but have no description in either curriculum document: `descriptionTH` and `descriptionEN` are null.
- 2404470's prerequisite (2404324 and 2404368) comes from the 2569 curriculum; the registrar report shows none.
- The curriculum's detailed course-to-PLO mapping matrix uses graphical symbols that the PDF text layer does not carry. Only the "example courses responsible for each PLO" list is included (`officialCourseExamples`), which is not exhaustive.
- `lastOpenedRegistrar` and `registrarCategory` are raw values from the registrar report; they are informational only.

## `courses.json` fields

`code`, `nameTH`, `nameEN`, `shortNameEN`, `credits`, `creditFormat` (e.g. `3 (3-0-6)`: lecture–practice–self-study hours), `level` (5th digit of the code, used as the year level), `department` (`PA` or `FACULTY`), `prerequisiteText`, `prerequisiteCodes`, `descriptionTH`, `descriptionEN`, `lastOpenedRegistrar`, `registrarCategory`. `externalCourses[]` have `managedHere: false` and no syllabus management.
