/** A caution as the dashboard and editor show it (built in $lib/server/cautions/view.ts). */
import type { CautionView } from '$lib/domain/cautionStats';

export type CautionDetail = CautionView & {
	a_ref: string;
	b_ref: string;
	a_label: string;
	b_label: string;
	a_semester: string;
	b_semester: string;
	reason_th: string;
	suggestion_th: string;
	source: string;
	resolution_note: string | null;
	a_instructors: string[];
	b_instructors: string[];
	byOther: boolean;
	comments: { id: string; body: string; created_at: string; author: string | null }[];
	events: { id: number; status: string; relation: string | null; note: string | null; created_at: string; actor: string | null }[];
};
