/** Similarity as a word (spec 06 drawer): สูงมาก ≥ 0.85, สูง ≥ 0.7, ปานกลาง otherwise. */
export const similarityWord = (s: number) => (s >= 0.85 ? 'สูงมาก' : s >= 0.7 ? 'สูง' : 'ปานกลาง');
