/**
 * Replace e-mail addresses and phone numbers with placeholders before text goes to an AI
 * service (spec 02, "Data use on the free tier"; ThaiLLM terms forbid personal data).
 */
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
// Thai numbers: 0X-XXX-XXXX, 0XX-XXX-XXXX, 02 218 7200, +66 81 234 5678, 0812345678, with optional "ต่อ 123"
const PHONE = /(?<![\d-])(?:\+66[\s-]?|0)(?:\d[\s-]?){7,9}\d(?![\d-])(?:\s*(?:ต่อ|ext\.?|x)\s*\d{1,5})?/g;

export const EMAIL_PLACEHOLDER = '[อีเมล]';
export const PHONE_PLACEHOLDER = '[เบอร์โทรศัพท์]';

export function redactContacts(text: string): string {
	return text.replace(EMAIL, EMAIL_PLACEHOLDER).replace(PHONE, (m) => {
		const digits = m.replace(/\D/g, '');
		// keep years, ISBNs and other long numbers that are not phone-shaped
		if (digits.length < 9 || digits.length > 13) return m;
		return PHONE_PLACEHOLDER;
	});
}
