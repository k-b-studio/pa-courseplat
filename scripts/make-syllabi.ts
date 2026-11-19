/**
 * npm run make:syllabi — expand fixtures/syllabi/src/*.ts into fixtures/syllabi/<semester>/<code>.json
 * (one SyllabusDoc per offering, spec 08) and fixtures/syllabi/index.json (status per offering).
 * The seed reads only the JSON; tests/unit/syllabi.test.ts fails if the JSON is out of date.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { syllabusSources } from '../fixtures/syllabi/src/index';

const index: Record<string, Record<string, string>> = {};
for (const [semester, { syllabi, STATUS }] of Object.entries(syllabusSources)) {
	mkdirSync(`fixtures/syllabi/${semester}`, { recursive: true });
	index[semester] = {};
	for (const [code, doc] of Object.entries(syllabi)) {
		writeFileSync(`fixtures/syllabi/${semester}/${code}.json`, JSON.stringify(doc, null, '\t') + '\n');
		index[semester][code] = STATUS[code];
	}
}
writeFileSync('fixtures/syllabi/index.json', JSON.stringify(index, null, '\t') + '\n');
console.log(Object.entries(index).map(([s, o]) => `${s}: ${Object.keys(o).length}`).join(', '));
