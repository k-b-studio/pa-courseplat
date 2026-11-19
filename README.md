# PA CoursePlat (demo)

แพลตฟอร์มกลางรายวิชา ภาควิชารัฐประศาสนศาสตร์ คณะรัฐศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย: a prototype where professors put each semester's syllabus into one structured form (by uploading the Word/PDF they already have, or filling in a form), get warned about content and assignments that overlap with other PA courses, and publish clear course pages that students can read and compare before registering.

- **Concept and decisions:** [specs/01-concept.md](specs/01-concept.md)
- **Implementation specs and build order:** [specs/README.md](specs/README.md)
- **Presentation script:** [specs/08-seed-data-and-demo-script.md](specs/08-seed-data-and-demo-script.md#demo-script-about-10-minutes)
- **Real catalog data and its sources:** [data/README.md](data/README.md)

Status: phases P0–P5 are built (student pages, instructor editor, AI import, Content Caution); P6 (staff dashboard) and P7 (demo reset and script) are next. Served at **kbstudio.space/pa-courseplat** (the app lives under the base path `/pa-courseplat`; locally `npm run dev` → http://localhost:5173/pa-courseplat/). Every person, syllabus and caution in the demo is fictional. Prototype for presentation only; not an official Chulalongkorn University system.
