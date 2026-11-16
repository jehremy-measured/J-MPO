import type { PlanTarget } from "../types";

export type ConversionTypeGroupId = "baseline" | "rollup" | "attribute";

export type ConversionTypeOption = {
  id: string;
  name: string;
  desc: string;
  group: ConversionTypeGroupId;
  /** For a roll-up option: ids of the baseline options it aggregates, shown on hover. */
  rollupOf?: string[];
};

export type ConversionTypeGroup = {
  group: ConversionTypeGroupId;
  label: string;
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

export type PlanTypeChoice = "outcomes" | "spend" | null;

export type BuildScreen = "plan-type" | "period" | "target" | "ct" | "method" | "upload" | "review";

export type SourceWindow = {
  start: Date;
  end: Date;
  label: string;
};

export type BuildPlanState = {
  screen: BuildScreen;
  planType: PlanTypeChoice;
  planStart: Date;
  planEnd: Date;
  target: PlanTarget | null;
  targetValue: number | null;
  singleCT: string | null;
  attrs: string[];
  method: BuildMethod;
  source: string;
  sourceStart: Date;
  budget: Record<string, number | null>;
  overridden: Record<string, boolean>;
  included: Record<string, boolean>;
  query: string;
  channels: string[];
};

export type ExcludeReason = "no-budget-in-file" | "no-spend-12mo" | null;
