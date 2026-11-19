/** File type from magic bytes, never from the extension (spec 05 "Security notes"). */
export type SourceKind = 'docx' | 'pdf' | 'image' | 'doc';
export type Sniffed = { kind: SourceKind; mime: string } | null;

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);

export function sniff(bytes: Uint8Array): Sniffed {
	if (starts(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return { kind: 'pdf', mime: 'application/pdf' }; // %PDF-
	if (starts(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: 'image', mime: 'image/png' };
	if (starts(bytes, [0xff, 0xd8, 0xff])) return { kind: 'image', mime: 'image/jpeg' };
	if (starts(bytes, [0x52, 0x49, 0x46, 0x46]) && starts(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return { kind: 'image', mime: 'image/webp' }; // RIFF....WEBP
	if (starts(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { kind: 'doc', mime: 'application/msword' }; // old .doc: refused
	// .docx: a ZIP (PK\x03\x04) with a word/document.xml entry
	if (starts(bytes, [0x50, 0x4b, 0x03, 0x04]) && new TextDecoder('latin1').decode(bytes.subarray(0, Math.min(bytes.length, 200_000))).includes('word/document.xml'))
		return { kind: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
	return null;
}
