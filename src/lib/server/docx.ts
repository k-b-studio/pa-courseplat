/**
 * .docx → text for the AI (tables kept as pipe rows) and → sanitised HTML for the review screen
 * (spec 05). mammoth's HTML is never rendered unsanitised.
 */
import DOMPurify from 'isomorphic-dompurify';
import mammoth from 'mammoth';

export async function docxToHtml(bytes: Uint8Array): Promise<string> {
	const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
	return value;
}

export function sanitizeHtml(html: string): string {
	return DOMPurify.sanitize(html, {
		ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'strong', 'em', 'b', 'i', 'br'],
		ALLOWED_ATTR: []
	});
}

const decode = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/** HTML from mammoth → plain text with markdown-ish headings, bullets and table rows */
export function htmlToText(html: string): string {
	return decode(
		html
			// mammoth wraps cell text in <p>: keep each cell on one line
			.replace(/<(td|th)([^>]*)>([\s\S]*?)<\/\1>/gi, (_m, tag: string, attrs: string, inner: string) => `<${tag}${attrs}>${inner.replace(/<\/?p[^>]*>/gi, ' ').replace(/\s+/g, ' ').trim()}</${tag}>`)
			.replace(/<\/(td|th)>\s*<(td|th)[^>]*>/gi, ' | ')
			.replace(/<tr[^>]*>/gi, '\n| ')
			.replace(/<\/tr>/gi, ' |')
			.replace(/<h([1-6])[^>]*>/gi, (_, n) => `\n\n${'#'.repeat(Number(n))} `)
			.replace(/<li[^>]*>/gi, '\n- ')
			.replace(/<(br|\/p|\/h[1-6]|\/table)[^>]*>/gi, '\n')
			.replace(/<[^>]+>/g, '')
	)
		.replace(/[ \t]+\n/g, '\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export async function docxToText(bytes: Uint8Array): Promise<string> {
	return htmlToText(await docxToHtml(bytes));
}
