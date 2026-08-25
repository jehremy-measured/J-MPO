import { addDays, formatShortDate } from "./dateUtils";
import { AVERAGE_ORDER_VALUE } from "../types";
import type { PlanTarget } from "../types";
import type { BuildTactic, ConversionTypeGroup, PlanTypeChoice, SourceWindow } from "./types";

export { formatShortDate };

/** Default planning window shown when the build-plan flow first opens. */
export const DEFAULT_PLAN_START = new Date(2026, 7, 11); // Aug 11, 2026
export const DEFAULT_PLAN_END = new Date(2026, 8, 11); // Sep 11, 2026

export const PLAN_TYPE_OPTIONS: { id: Exclude<PlanTypeChoice, null>; label: string; desc: string }[] = [
  {
    id: "outcomes",
    label: "Project outcomes",
    desc: "Start from a budget you already have in mind and see the results it's likely to produce.",
  },
  {
    id: "spend",
    label: "Optimize spend",
    desc: "Start from a target outcome and get a recommended budget allocation to reach it.",
  },
];

export const TARGET_OPTIONS: { id: PlanTarget; label: string }[] = [
  { id: "incremental-sales", label: "Incremental Sales target" },
  { id: "incremental-orders", label: "Incremental Orders target" },
  { id: "incremental-roas", label: "Incremental ROAS target" },
  { id: "incremental-cpo", label: "Incremental CPO target" },
];

export const CT_GROUPS: ConversionTypeGroup[] = [
  {
    group: "baseline",
    label: "Baseline",
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
    selectionType: "single",
    items: [
      { id: "omni", name: "Omni Orders", desc: "Online + In-Store combined", group: "rollup", rollupOf: ["online", "instore"] },
      { id: "total", name: "Total Orders", desc: "All conversion sources", group: "rollup", rollupOf: ["online", "instore", "retail"] },
    ],
  },
  {
    group: "attribute",
    label: "Attributes",
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
  "Paid Search (SEM)": "#2f5fbd",
  "Paid Social": "#e01e5a",
  Display: "#1da696",
  Video: "#ff5420",
  Affiliate: "#8b5cf6",
  AppLovin: "#f59e0b",
  Klaviyo: "#0d9488",
  Remarketing: "#7c6f57",
  "Shopping (PLA)": "#22a559",
  TV: "#b45309",
  Youtube: "#ff0000",
};

/** Lulus's real tactic list, sourced from Measured's reference-period spend for Jul 10 – Aug 10, 2026. */
export const BUILD_TACTICS: BuildTactic[] = [
  { id: "google_pla_troas", name: "Google - PLA tROAS", channel: "Shopping (PLA)" },
  { id: "facebook_conversion_prospecting", name: "Facebook - Conversion - Prospecting", channel: "Paid Social" },
  { id: "facebook_conversion_remarketing", name: "Facebook - Conversion - Remarketing", channel: "Paid Social" },
  { id: "pinterest_conversion_prospecting", name: "Pinterest - Conversion - Prospecting", channel: "Paid Social" },
  { id: "affiliate_loyalty", name: "Affiliate - Loyalty", channel: "Affiliate" },
  { id: "google_non_brand_search_troas_us", name: "Google - Non Brand Search tROAS US", channel: "Paid Search (SEM)" },
  { id: "rtb_house_retargeting", name: "RTB House Retargeting", channel: "Remarketing" },
  { id: "applovin_prospecting", name: "Applovin - Prospecting", channel: "AppLovin" },
  { id: "affiliate_subnetwork", name: "Affiliate - Subnetwork", channel: "Affiliate" },
  { id: "reddit_conversion_prospecting", name: "Reddit - Conversion - Prospecting", channel: "Paid Social" },
  { id: "tiktok_conversion_prospecting", name: "TikTok - Conversion - Prospecting", channel: "Paid Social" },
  { id: "facebook_branded_performance", name: "Facebook - Branded - Performance", channel: "Paid Social" },
  { id: "google_brand_us", name: "Google - Brand US", channel: "Paid Search (SEM)" },
  { id: "others", name: "Others", channel: "TV" },
  { id: "criteo_retargeting", name: "Criteo Retargeting", channel: "Remarketing" },
  { id: "ctv_prospecting", name: "CTV - Prospecting", channel: "TV" },
  { id: "facebook_conversion_prospecting_auto", name: "Facebook - Conversion - Prospecting - Auto", channel: "Paid Social" },
  { id: "affiliate_creator", name: "Affiliate - Creator", channel: "Affiliate" },
  { id: "snapchat_conversion_prospecting", name: "Snapchat - Conversion - Prospecting", channel: "Paid Social" },
  { id: "klaviyo_sms", name: "Klaviyo - SMS", channel: "Klaviyo" },
  { id: "tv_scientific_prospecting", name: "TV Scientific Prospecting", channel: "TV" },
  { id: "facebook_conversion_retargeting", name: "Facebook - Conversion - Retargeting", channel: "Paid Social" },
  { id: "affiliate_content", name: "Affiliate - Content", channel: "Affiliate" },
  { id: "pinterest_conversions_prospecting_auto", name: "Pinterest  - Conversions - Prospecting - Auto", channel: "Paid Social" },
  { id: "klaviyo_email", name: "Klaviyo - Email", channel: "Klaviyo" },
  { id: "youtube_demand_gen_remarketing", name: "YouTube Demand Gen - Remarketing", channel: "Youtube" },
  { id: "youtube_demand_gen_midfunnel", name: "YouTube Demand Gen - MidFunnel", channel: "Youtube" },
  { id: "pinterest_branded_performance", name: "Pinterest - Branded - Performance", channel: "Paid Social" },
  { id: "rtb_house_prospecting", name: "RTB House Prospecting", channel: "Display" },
  { id: "tv_scientific_retargeting", name: "TV Scientific Retargeting", channel: "TV" },
  { id: "ctv_retargeting", name: "CTV - Retargeting", channel: "TV" },
  { id: "reddit_brand_performance", name: "Reddit - Brand - Performance", channel: "Paid Social" },
  { id: "tiktok_branded_performance", name: "TikTok - Branded - Performance", channel: "Paid Social" },
  { id: "bing_pla", name: "Bing - PLA", channel: "Shopping (PLA)" },
  { id: "pinterest_shopping_prospecting", name: "Pinterest Shopping Prospecting", channel: "Paid Social" },
  { id: "bing_non_brand_us", name: "Bing - Non Brand US", channel: "Paid Search (SEM)" },
  { id: "snapchat_conversion_retargeting", name: "Snapchat - Conversion - Retargeting", channel: "Paid Social" },
  { id: "youtube_demand_gen_crossselling", name: "YouTube Demand Gen - CrossSelling", channel: "Youtube" },
  { id: "bing_brand_us", name: "Bing - Brand US", channel: "Paid Search (SEM)" },
  { id: "affiliate_shopping", name: "Affiliate - Shopping", channel: "Affiliate" },
  { id: "youtube_demand_gen_acquisition", name: "YouTube Demand Gen - Acquisition", channel: "Youtube" },
  { id: "tiktok_conversion_retargeting", name: "TikTok - Conversion - Retargeting", channel: "Paid Social" },
  { id: "gdn_retargeting", name: "GDN Retargeting", channel: "Remarketing" },
  { id: "criteo_prospecting", name: "Criteo Prospecting", channel: "Display" },
  { id: "snapchat_branded_performance", name: "Snapchat - Branded - Performance", channel: "Paid Social" },
  { id: "affiliate_coupon", name: "Affiliate - Coupon", channel: "Affiliate" },
  { id: "others_2", name: "Others", channel: "Paid Social" },
  { id: "youtube_ppc_acquisition_vac", name: "YouTube PPC - Acquisition VAC", channel: "Youtube" },
  { id: "affiliate_other", name: "Affiliate - Other", channel: "Affiliate" },
  { id: "google_pla", name: "Google - PLA", channel: "Shopping (PLA)" },
];

/** Total actual spend per tactic over the Jul 10 – Aug 10, 2026 reference window (32 days) — Lulus, Online Orders. */
const LULUS_REF_TOTAL: Record<string, number> = {
  google_pla_troas: 655571,
  facebook_conversion_prospecting: 383281,
  facebook_conversion_remarketing: 228356,
  pinterest_conversion_prospecting: 181816,
  affiliate_loyalty: 152193,
  google_non_brand_search_troas_us: 150682,
  rtb_house_retargeting: 131343,
  applovin_prospecting: 120199,
  affiliate_subnetwork: 104918,
  reddit_conversion_prospecting: 100551,
  tiktok_conversion_prospecting: 98889,
  facebook_branded_performance: 97340,
  google_brand_us: 77847,
  others: 62945,
  criteo_retargeting: 52487,
  ctv_prospecting: 47874,
  facebook_conversion_prospecting_auto: 47813,
  affiliate_creator: 47261,
  snapchat_conversion_prospecting: 46810,
  klaviyo_sms: 44851,
  tv_scientific_prospecting: 38075,
  facebook_conversion_retargeting: 33883,
  affiliate_content: 33506,
  pinterest_conversions_prospecting_auto: 32526,
  klaviyo_email: 30118,
  youtube_demand_gen_remarketing: 28659,
  youtube_demand_gen_midfunnel: 28344,
  pinterest_branded_performance: 24441,
  rtb_house_prospecting: 19879,
  tv_scientific_retargeting: 18075,
  ctv_retargeting: 17272,
  reddit_brand_performance: 16737,
  tiktok_branded_performance: 14971,
  bing_pla: 11717,
  pinterest_shopping_prospecting: 10969,
  bing_non_brand_us: 10804,
  snapchat_conversion_retargeting: 9586,
  youtube_demand_gen_crossselling: 5973,
  bing_brand_us: 5521,
  affiliate_shopping: 4105,
  youtube_demand_gen_acquisition: 3992,
  tiktok_conversion_retargeting: 3669,
  gdn_retargeting: 2415,
  criteo_prospecting: 2379,
  snapchat_branded_performance: 1999,
  affiliate_coupon: 1996,
  others_2: 1901,
  youtube_ppc_acquisition_vac: 466,
  affiliate_other: 16,
  google_pla: 2,
};

const LULUS_REF_DAYS = 32;

export const DAILY_RATE: Record<string, number> = {};
BUILD_TACTICS.forEach((t) => (DAILY_RATE[t.id] = LULUS_REF_TOTAL[t.id] / LULUS_REF_DAYS));

/** budget_plan.xlsx as "uploaded" — Lulus's reference-period spend by tactic. */
export const XLS_BUDGET: Record<string, number | null> = { ...LULUS_REF_TOTAL };

const ANCHOR = new Date(2026, 7, 10); // Aug 10, 2026 — day before the planning period starts

/** Default source-period start: the most recent window of this length ending at the anchor date. */
export function defaultSourceStart(planDays: number): Date {
  return addDays(ANCHOR, -(planDays - 1));
}

export function windowFromStart(start: Date, planDays: number): SourceWindow {
  const end = addDays(start, planDays - 1);
  return { start, end, label: `${formatShortDate(start)} – ${formatShortDate(end)} (${planDays} days)` };
}

/** The exact bounds of the only historical performance window we have actuals for. */
export const REFERENCE_WINDOW_START = new Date(2026, 6, 10); // Jul 10, 2026
export const REFERENCE_WINDOW_END = ANCHOR; // Aug 10, 2026

const REFERENCE_TOTAL_SPEND = Object.values(LULUS_REF_TOTAL).reduce((sum, v) => sum + v, 0);

/** Blended incremental ROAS for Lulus, Online Orders, over the reference window. */
export const REFERENCE_ROAS = 4.32;

/** Reference incremental sales for that same window, and its per-day rate for scaling to other lengths. */
export const REFERENCE_INCREMENTAL_SALES = Math.round(REFERENCE_TOTAL_SPEND * REFERENCE_ROAS);
export const REFERENCE_DAILY_INCREMENTAL_SALES = REFERENCE_INCREMENTAL_SALES / LULUS_REF_DAYS;

/** Reference incremental orders, derived from the sales reference figure above via the shared
 * average-order-value assumption (no direct order-count reference data exists). */
export const REFERENCE_INCREMENTAL_ORDERS = Math.round(REFERENCE_INCREMENTAL_SALES / AVERAGE_ORDER_VALUE);
export const REFERENCE_DAILY_INCREMENTAL_ORDERS = REFERENCE_INCREMENTAL_ORDERS / LULUS_REF_DAYS;
export const REFERENCE_CPO = REFERENCE_TOTAL_SPEND / REFERENCE_INCREMENTAL_ORDERS;

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
