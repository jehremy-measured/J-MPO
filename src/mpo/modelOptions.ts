export type ModelOption = {
  id: "current" | "latest";
  date: string;
};

export const CURRENT_MODEL: ModelOption = { id: "current", date: "Aug 30, 2026" };
export const LATEST_MODEL: ModelOption = { id: "latest", date: "Sep 6, 2026" };

export const isOnLatestModel = CURRENT_MODEL.date === LATEST_MODEL.date;
