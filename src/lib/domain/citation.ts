/**
 * "แยกข้อมูลจากรายการอ้างอิง" (spec 05 R4): split a pasted APA-style citation into fields.
 * Simple regexes, best effort; the AI import does this better. Pure; unit-tested.
 */
export type ParsedCitation = { authors: string; year: number | null; title: string; type: 'book' | 'article' | 'chapter' | 'report' | 'law' | 'web' | 'other'; doi: string | null; isbn: string | null; url: string | null };

export function parseCitation(raw: string): ParsedCitation {
	const s = raw.replace(/\s+/g, ' ').trim();
	const doi = /\b(10\.\d{4,9}\/[^\s]+?)\.?(?:\s|$)/i.exec(s)?.[1] ?? null;
	const url = /(https?:\/\/[^\s]+?)\.?(?:\s|$)/i.exec(s)?.[1] ?? null;
	const isbnMatch = /ISBN[:\s]*([0-9Xx-]{10,17})/i.exec(s);
	const isbn = isbnMatch ? isbnMatch[1].replace(/-/g, '') : null;
	let type: ParsedCitation['type'] = /พระราชบัญญัติ|พระราชกฤษฎีกา|ประกาศ/.test(s) ? 'law' : 'other';

	// Authors (Year). Title. Rest  — e.g. "Dye, T. R. (2017). Understanding public policy (15th ed.). Pearson."
	const head = /^(.+?)\s*\((\d{4})[a-z]?\)\.\s*/.exec(s);
	const tail = head ? s.slice(head[0].length) : '';
	const end = /[.?!](\s|$)/.exec(tail);
	const apa = head && end ? [head[1], head[2], tail.slice(0, end.index + (tail[end.index] === '.' ? 0 : 1)), tail.slice(end.index + 1).trim()] : null;
	if (apa) {
		const [authors, year, title, rest] = apa;
		if (/\b\d+\s*\(\d+\)|,\s*\d+\s*[–-]\s*\d+/.test(rest)) type = 'article';
		else if (/^In\s|\(Eds?\.\)|ใน\s/.test(rest)) type = 'chapter';
		else if (type === 'other') type = url && !/Press|Publisher|สำนักพิมพ์/.test(rest) ? 'web' : 'book';
		return { authors: authors.replace(/,\s*$/, ''), year: Number(year), title: title.replace(/\s*\([^)]*\b(ed|eds|edition)\b\.?[^)]*\)\s*$/i, ''), type, doi, isbn, url };
	}
	// Thai style without a year: "ผู้แต่ง. ชื่อเรื่อง. สำนักพิมพ์."
	const parts = s.split(/\.\s+/).filter(Boolean);
	if (parts.length >= 2) return { authors: parts[0], year: /\b(19|20)\d{2}\b/.exec(s) ? Number(/\b((?:19|20)\d{2})\b/.exec(s)![1]) : null, title: parts[1].replace(/\.$/, ''), type: type === 'other' ? 'book' : type, doi, isbn, url };
	return { authors: '', year: null, title: s.replace(/\.$/, ''), type, doi, isbn, url };
}
