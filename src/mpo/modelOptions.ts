export type ModelTag = "Existing model" | "Latest model";

export type ModelOption = {
  id: string;
  date: string;
  tactics: number;
  tag?: ModelTag;
};

// Weekly automatic model refreshes, most recent first. The first two are always shown; the
// rest sit behind "View older models" so the list doesn't overwhelm the default view.
export const MODELS: ModelOption[] = [
  { id: "existing", date: "Aug 30, 2026", tactics: 75, tag: "Existing model" },
  { id: "latest", date: "Sep 6, 2026", tactics: 68, tag: "Latest model" },
  { id: "m1", date: "Aug 23, 2026", tactics: 61 },
  { id: "m2", date: "Aug 16, 2026", tactics: 84 },
  { id: "m3", date: "Aug 9, 2026", tactics: 57 },
  { id: "m4", date: "Aug 2, 2026", tactics: 92 },
  { id: "m5", date: "Jul 26, 2026", tactics: 70 },
  { id: "m6", date: "Jul 19, 2026", tactics: 65 },
  { id: "m7", date: "Jul 12, 2026", tactics: 78 },
  { id: "m8", date: "Jul 5, 2026", tactics: 54 },
  { id: "m9", date: "Jun 28, 2026", tactics: 88 },
  { id: "m10", date: "Jun 21, 2026", tactics: 73 },
];

export const DEFAULT_VISIBLE_MODELS = 2;
