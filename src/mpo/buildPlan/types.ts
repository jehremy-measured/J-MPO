export type ConversionTypeGroupId = "baseline" | "rollup" | "attribute";

export type ConversionTypeOption = {
  id: string;
  name: string;
  desc: string;
  group: ConversionTypeGroupId;
};

export type ConversionTypeGroup = {
  group: ConversionTypeGroupId;
  label: string;
  sub: string;
  selectionType: "single" | "multi";
  items: ConversionTypeOption[];
};

export type BuildTactic = {
  id: string;
  name: string;
  channel: string;
  dormant?: boolean;
};

export type BuildMethod = "upload" | "fetch" | null;

export type BuildScreen = "period" | "ct" | "method" | "upload" | "review" | "done";

export type SourceWindow = {
  start: Date;
  end: Date;
  label: string;
};

export type BuildPlanState = {
  screen: BuildScreen;
  planStart: Date;
  planEnd: Date;
  singleCT: string | null;
  attrs: string[];
  method: BuildMethod;
  source: string;
  sourceStart: Date;
  budget: Record<string, number | null>;
  overridden: Record<string, boolean>;
  included: Record<string, boolean>;
  query: string;
  channel: string;
};

export type ExcludeReason = "no-budget-in-file" | "no-spend-12mo" | null;
