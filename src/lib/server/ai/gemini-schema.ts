/**
 * Convert a JSON Schema (from z.toJSONSchema) into the subset Gemini's responseJsonSchema
 * honours (spec 02): keep type/title/description/properties/required/additionalProperties/
 * enum/format/minimum/maximum/items/prefixItems/minItems/maxItems; drop $schema, default,
 * minLength, maxLength, pattern and anything else; express nullable as a type array;
 * fail loudly on $ref, anyOf, oneOf and allOf that cannot be flattened.
 */

type Json = Record<string, unknown>;

const KEEP = new Set([
	'type',
	'title',
	'description',
	'properties',
	'required',
	'additionalProperties',
	'enum',
	'format',
	'minimum',
	'maximum',
	'items',
	'prefixItems',
	'minItems',
	'maxItems'
]);
const FORMATS = new Set(['date', 'time', 'date-time']);
const SAFE = Number.MAX_SAFE_INTEGER;

export class SchemaSubsetError extends Error {}

function isNullSchema(s: unknown): boolean {
	return typeof s === 'object' && s !== null && (s as Json).type === 'null' && Object.keys(s as Json).length === 1;
}

export function toGeminiSchema(input: unknown, path = '#'): Json {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		throw new SchemaSubsetError(`${path}: not a schema object`);
	}
	let s = { ...(input as Json) };

	if ('$ref' in s) throw new SchemaSubsetError(`${path}: $ref is not allowed in the Gemini schema`);
	if ('allOf' in s) throw new SchemaSubsetError(`${path}: allOf is not allowed in the Gemini schema`);
	if ('oneOf' in s) throw new SchemaSubsetError(`${path}: oneOf is not allowed in the Gemini schema`);

	// Zod 4 writes `x.nullable()` as anyOf [X, {type:'null'}]: flatten to a type array.
	if ('anyOf' in s) {
		const variants = s.anyOf as unknown[];
		const nonNull = variants.filter((v) => !isNullSchema(v));
		if (variants.length !== 2 || nonNull.length !== 1) {
			throw new SchemaSubsetError(`${path}: anyOf is not allowed in the Gemini schema (only nullable X)`);
		}
		const inner = nonNull[0] as Json;
		if ('anyOf' in inner || '$ref' in inner || typeof inner.type !== 'string') {
			throw new SchemaSubsetError(`${path}: nullable of a non-simple schema`);
		}
		const { anyOf: _drop, ...rest } = s;
		s = { ...inner, ...rest, type: [inner.type, 'null'] };
		if (Array.isArray(s.enum)) s.enum = [...(s.enum as unknown[]), null];
	}

	// const → single-value enum
	if ('const' in s) {
		s.enum = [s.const];
		if (!s.type) s.type = typeof s.const === 'number' ? (Number.isInteger(s.const) ? 'integer' : 'number') : 'string';
	}

	const out: Json = {};
	for (const [k, v] of Object.entries(s)) {
		if (!KEEP.has(k)) continue;
		if (k === 'format' && !FORMATS.has(String(v))) continue;
		if ((k === 'minimum' || k === 'maximum') && typeof v === 'number' && Math.abs(v) >= SAFE) continue;
		out[k] = v;
	}

	const types = Array.isArray(out.type) ? out.type : [out.type];
	if (types.includes('object')) {
		const props = (s.properties ?? {}) as Json;
		out.properties = Object.fromEntries(
			Object.entries(props).map(([k, v]) => [k, toGeminiSchema(v, `${path}/properties/${k}`)])
		);
		out.additionalProperties = false;
		if (!out.required) out.required = Object.keys(props);
	}
	if (types.includes('array')) {
		if (s.items) out.items = toGeminiSchema(s.items, `${path}/items`);
		if (Array.isArray(s.prefixItems)) {
			out.prefixItems = (s.prefixItems as unknown[]).map((p, i) => toGeminiSchema(p, `${path}/prefixItems/${i}`));
		}
	}
	return out;
}
