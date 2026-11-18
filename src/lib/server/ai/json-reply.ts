/**
 * Pull a JSON object out of a chat reply (ThaiLLM): drop any <think>…</think> block,
 * accept code fences and trailing text, and return the first balanced object.
 */
export function stripThink(text: string): string {
	let t = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
	// an unterminated think block (cut off by max_tokens) swallows the rest
	const open = t.search(/<think>/i);
	if (open >= 0) t = t.slice(0, open);
	return t.trim();
}

export function firstJsonObject(text: string): string | null {
	const start = text.indexOf('{');
	if (start < 0) return null;
	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let i = start; i < text.length; i++) {
		const c = text[i];
		if (inString) {
			if (escaped) escaped = false;
			else if (c === '\\') escaped = true;
			else if (c === '"') inString = false;
			continue;
		}
		if (c === '"') inString = true;
		else if (c === '{') depth++;
		else if (c === '}') {
			depth--;
			if (depth === 0) return text.slice(start, i + 1);
		}
	}
	return null;
}

export class JsonReplyError extends Error {
	constructor(
		message: string,
		readonly raw: string
	) {
		super(message);
	}
}

export function parseJsonReply(text: string): unknown {
	const cleaned = stripThink(text);
	const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const candidates = [fenced?.[1], cleaned].filter((x): x is string => typeof x === 'string');
	for (const c of candidates) {
		const obj = firstJsonObject(c);
		if (!obj) continue;
		try {
			return JSON.parse(obj);
		} catch {
			/* try the next candidate */
		}
	}
	throw new JsonReplyError('no JSON object in the reply', text.slice(0, 500));
}
