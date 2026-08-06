import { addDays, formatShortDate } from "./dateUtils";
import type { BuildTactic, ConversionTypeGroup, SourceWindow } from "./types";

export { formatShortDate };

/** Default planning window shown when the build-plan flow first opens. */
export const DEFAULT_PLAN_START = new Date(2025, 9, 1); // Oct 1, 2025
export const DEFAULT_PLAN_END = new Date(2025, 11, 31); // Dec 31, 2025

export const CT_GROUPS: ConversionTypeGroup[] = [
  {
    group: "baseline",
    label: "Baseline",
    sub: "raw conversion types",
    selectionType: "single",
    items: [
      { id: "online", name: "Online Orders", desc: "Ecommerce conversions", group: "baseline" },
      { id: "instore", name: "In-Store Orders", desc: "Retail / brick-and-mortar", group: "baseline" },
      { id: "retail", name: "Retail Orders", desc: "Wholesale + marketplace", group: "baseline" },
    ],
  },
  {
    group: "rollup",
    label: "Roll-up",
    sub: "aggregated across sources",
    selectionType: "single",
    items: [
      { id: "omni", name: "Omni Orders", desc: "Online + In-Store combined", group: "rollup" },
      { id: "total", name: "Total Orders", desc: "All conversion sources", group: "rollup" },
    ],
  },
  {
    group: "attribute",
    label: "Attributes",
    sub: "combine multiple",
    selectionType: "multi",
    items: [
      { id: "newcust", name: "New Customers", desc: "First-time buyers", group: "attribute" },
      { id: "return", name: "Returning Customers", desc: "Repeat buyers", group: "attribute" },
      { id: "subs", name: "Subscription Orders", desc: "Recurring revenue", group: "attribute" },
    ],
  },
];

export const CT_LOOKUP: Record<string, string> = {};
CT_GROUPS.forEach((g) => g.items.forEach((i) => (CT_LOOKUP[i.id] = i.name)));

export const CHANNEL_COLORS: Record<string, string> = {
  "Paid Search": "#2f5fbd",
  "Paid Social": "#e01e5a",
  Display: "#1da696",
  Video: "#ff5420",
};

export const BUILD_TACTICS: BuildTactic[] = [
  { id: "gb", name: "Google Brand", channel: "Paid Search" },
  { id: "gnb", name: "Google Non-Brand", channel: "Paid Search" },
  { id: "mp", name: "Meta Prospecting", channel: "Paid Social" },
  { id: "mr", name: "Meta Retargeting", channel: "Paid Social" },
  { id: "tt", name: "TikTok", channel: "Paid Social", dormant: true },
  { id: "pin", name: "Pinterest", channel: "Paid Social" },
  { id: "pd", name: "Programmatic Display", channel: "Display" },
  { id: "cr", name: "Criteo Retargeting", channel: "Display", dormant: true },
  { id: "yt", name: "YouTube", channel: "Video" },
];

const Q3_92: Record<string, number> = {
  gb: 118_000,
  gnb: 249_000,
  mp: 337_000,
  mr: 104_000,
  tt: 79_000,
  pin: 53_000,
  pd: 150_000,
  cr: 60_000,
  yt: 86_000,
};

export const DAILY_RATE: Record<string, number> = {};
BUILD_TACTICS.forEach((t) => (DAILY_RATE[t.id] = Q3_92[t.id] / 92));

/** budget_plan.xlsx as "uploaded" — Pinterest & YouTube left blank in the seed file */
export const XLS_BUDGET: Record<string, number | null> = {
  gb: 42_000,
  gnb: 88_000,
  mp: 120_000,
  mr: 36_000,
  tt: 28_000,
  pin: null,
  pd: 54_000,
  cr: 22_000,
  yt: null,
};

const ANCHOR = new Date(2025, 8, 30);

/** Default source-period start: the most recent window of this length ending at the anchor date. */
export function defaultSourceStart(planDays: number): Date {
  return addDays(ANCHOR, -(planDays - 1));
}

export function windowFromStart(start: Date, planDays: number): SourceWindow {
  const end = addDays(start, planDays - 1);
  return { start, end, label: `${formatShortDate(start)} – ${formatShortDate(end)} (${planDays} days)` };
}

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
