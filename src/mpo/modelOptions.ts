export type ModelOption = {
  id: "current" | "latest";
  date: string;
};

/** Default MIM model date for plans that don't set `Plan.modelDate`. */
export const CURRENT_MODEL_DATE = "Aug 30, 2026";
export const LATEST_MODEL_DATE = "Sep 6, 2026";

export function isModelUpToDate(modelDate: string): boolean {
  return modelDate === LATEST_MODEL_DATE;
}
