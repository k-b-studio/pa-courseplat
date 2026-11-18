/**
 * AI extraction result (spec 05). `doc` is draft-level valid; `meta` has one explicit property
 * per section (no open maps, so the JSON Schema stays inside Gemini's subset).
 */
import { z } from 'zod';
import { makeSyllabusSchema, PLO_CODES } from './syllabus';

export const SECTION_KEYS = [
	'overview',
	'objectives',
	'approach',
	'weeklyPlan',
	'evaluation',
	'resources',
	'work',
	'keyDates'
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const CONFIDENCE = ['high', 'medium', 'low', 'not_found'] as const;
export type Confidence = (typeof CONFIDENCE)[number];

export const SectionMeta = z.object({
	confidence: z.enum(CONFIDENCE),
	evidence: z.string().describe('Shortest verbatim quote from the document supporting this section, at most 300 characters')
});
export type SectionMeta = z.infer<typeof SectionMeta>;

const metaShape = Object.fromEntries(SECTION_KEYS.map((k) => [k, SectionMeta])) as Record<SectionKey, typeof SectionMeta>;
export const ExtractionMeta = z.object(metaShape);

export const SectionHint = z.object({
	sectionNo: z.number().int().nullable(),
	instructorNames: z.array(z.string()),
	weekday: z.number().int().min(1).max(7).nullable().describe('1 = Monday … 7 = Sunday'),
	startsAt: z.string().nullable().describe('HH:MM, 24-hour'),
	endsAt: z.string().nullable().describe('HH:MM, 24-hour'),
	room: z.string().nullable()
});
export type SectionHint = z.infer<typeof SectionHint>;

export const InstructorMention = z.object({ name: z.string(), weeks: z.array(z.number().int()) });
export const PloSuggestion = z.object({
	objectiveId: z.string(),
	ploCodes: z.array(z.enum(PLO_CODES)),
	reason: z.string()
});
export type PloSuggestion = z.infer<typeof PloSuggestion>;

const Doc = makeSyllabusSchema({ strict: false });

export const ExtractionResult = z.object({
	doc: Doc,
	meta: ExtractionMeta,
	sectionHints: z.array(SectionHint),
	instructorMentions: z.array(InstructorMention),
	ploSuggestions: z.array(PloSuggestion),
	warnings: z.array(z.string())
});
export type ExtractionResult = z.infer<typeof ExtractionResult>;

/* ---- ThaiLLM fallback: four section-sized calls (spec 05) ---- */

const docShape = Doc.shape;
const metaOf = <K extends SectionKey>(keys: readonly K[]) =>
	z.object(Object.fromEntries(keys.map((k) => [k, SectionMeta])) as Record<K, typeof SectionMeta>);

export const SliceA = z.object({
	overview: docShape.overview,
	objectives: docShape.objectives,
	approach: docShape.approach,
	meta: metaOf(['overview', 'objectives', 'approach'] as const)
});
export const SliceB = z.object({
	weeklyPlan: docShape.weeklyPlan,
	meta: metaOf(['weeklyPlan'] as const)
});
export const SliceC = z.object({
	evaluation: docShape.evaluation,
	work: docShape.work,
	keyDates: docShape.keyDates,
	warnings: z.array(z.string()),
	meta: metaOf(['evaluation', 'work', 'keyDates'] as const)
});
export const SliceD = z.object({
	resources: docShape.resources,
	sectionHints: z.array(SectionHint),
	instructorMentions: z.array(InstructorMention),
	ploSuggestions: z.array(PloSuggestion),
	meta: metaOf(['resources'] as const)
});
