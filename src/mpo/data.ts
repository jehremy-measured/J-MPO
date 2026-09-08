import { assets } from "../assets/figma";
import { LATEST_MODEL_DATE } from "./modelOptions";
import type { Plan, Tactic } from "./types";

export const PLANS: Plan[] = [
  {
    id: "default",
    label: "Default Plan",
    kind: "optimization",
    createdBy: "AS",
    lastEdited: new Date(2026, 7, 1),
    target: "incremental-roas",
    planStart: new Date(2026, 6, 2),
    planEnd: new Date(2026, 7, 1),
    shared: true,
  },
  {
    id: "sim-default",
    label: "Q3 2026 media simulation",
    kind: "simulation",
    createdBy: "JH",
    lastEdited: new Date(2026, 7, 10),
    target: "incremental-sales",
    targetValue: 9_500_000,
    planStart: new Date(2026, 6, 12),
    planEnd: new Date(2026, 7, 10),
    shared: true,
    modelDate: LATEST_MODEL_DATE,
  },
  {
    id: "sim-q3-inflight",
    label: "Q3 2026 quarterly simulation",
    kind: "simulation",
    createdBy: "JH",
    lastEdited: new Date(2026, 7, 20),
    target: "incremental-sales",
    targetValue: 24_000_000,
    planStart: new Date(2026, 6, 1),
    planEnd: new Date(2026, 8, 30),
    shared: false,
  },
  {
    id: "sim-default-copy",
    label: "Q3 2026 media simulation (copy)",
    kind: "simulation",
    createdBy: "JH",
    lastEdited: new Date(2026, 7, 10),
    target: "incremental-roas",
    targetValue: 12,
    planStart: new Date(2026, 6, 12),
    planEnd: new Date(2026, 7, 10),
    editVariant: "sidebar",
  },
];

/** A logo per tactic is unused in the UI today (tactic rows render a letter avatar instead),
 * so these just cycle through the available brand marks for variety. */
const LOGO_CYCLE = [assets.google, assets.meta, assets.bing, assets.tiktok, assets.snapchat];

/** The real Lulus Baseline Plan (client 10022 / brand 1007, plan 2627), pared down from its
 * full 47-tactic roster to the top tactic per channel/segment combination that matters, spanning
 * all 10 real channels. budgetOld/salesOld are reverse-derived from the plan's real reference
 * spend and the tactic's real marginal ROAS, so the app's own optimizer math reproduces the
 * real optimized budget/incremental-sales figures for the "balanced" mode. */
const LULUS_TACTICS: Tactic[] = [
  { id: "applovin-prospecting", name: "Applovin - Prospecting", channel: "AppLovin", segment: "Prospects", budgetOld: 93_808, budgetNew: 99_399, salesOld: 308_608, marginalRoas: 1.96 },
  { id: "tv-scientific-prospecting", name: "TV Scientific Prospecting", channel: "TV", segment: "Prospects", budgetOld: 72_425, budgetNew: 76_742, salesOld: 2_788_795, marginalRoas: 11.37 },
  { id: "ctv-prospecting", name: "CTV - Prospecting", channel: "TV", segment: "Prospects", budgetOld: 66_214, budgetNew: 70_160, salesOld: 201_435, marginalRoas: 2.32 },
  { id: "google-pla-troas", name: "Google - PLA tROAS", channel: "Shopping (PLA)", segment: "Prospects", budgetOld: 605_223, budgetNew: 641_294, salesOld: 3_274_774, marginalRoas: 3.26 },
  { id: "rtb-house-retargeting", name: "RTB House Retargeting", channel: "Remarketing", segment: "Customers", budgetOld: 73_704, budgetNew: 78_097, salesOld: 719_576, marginalRoas: 1.93 },
  { id: "criteo-retargeting", name: "Criteo Retargeting", channel: "Remarketing", segment: "Customers", budgetOld: 36_855, budgetNew: 39_052, salesOld: 266_767, marginalRoas: 2.33 },
  { id: "google-non-brand-search-troas-us", name: "Google - Non Brand Search tROAS US", channel: "Paid Search (SEM)", segment: "Prospects", budgetOld: 179_219, budgetNew: 189_900, salesOld: 568_569, marginalRoas: 1.91 },
  { id: "google-brand-us", name: "Google - Brand US", channel: "Paid Search (SEM)", segment: "Customers", budgetOld: 31_979, budgetNew: 33_885, salesOld: 175_393, marginalRoas: 2.11 },
  { id: "affiliate-creator", name: "Affiliate - Creator", channel: "Affiliate", segment: "Other", budgetOld: 93_765, budgetNew: 99_353, salesOld: 312_348, marginalRoas: 1.85 },
  { id: "affiliate-subnetwork", name: "Affiliate - Subnetwork", channel: "Affiliate", segment: "Other", budgetOld: 54_369, budgetNew: 57_609, salesOld: 199_118, marginalRoas: 2.11 },
  { id: "affiliate-loyalty", name: "Affiliate - Loyalty", channel: "Affiliate", segment: "Other", budgetOld: 46_250, budgetNew: 49_007, salesOld: 202_456, marginalRoas: 1.99 },
  { id: "klaviyo-sms", name: "Klaviyo - SMS", channel: "Klaviyo", segment: "Others", budgetOld: 25_674, budgetNew: 27_204, salesOld: 89_589, marginalRoas: 2.11 },
  { id: "klaviyo-email", name: "Klaviyo - Email", channel: "Klaviyo", segment: "Others", budgetOld: 22_855, budgetNew: 24_217, salesOld: 231_257, marginalRoas: 3.16 },
  { id: "youtube-demand-gen-midfunnel", name: "YouTube Demand Gen - MidFunnel", channel: "Youtube", segment: "Customers", budgetOld: 28_272, budgetNew: 29_957, salesOld: 170_614, marginalRoas: 1.9 },
  { id: "rtb-house-prospecting", name: "RTB House Prospecting", channel: "Display", segment: "Prospects", budgetOld: 14_952, budgetNew: 15_843, salesOld: 35_922, marginalRoas: 1.94 },
  { id: "facebook-conversion-prospecting", name: "Facebook - Conversion - Prospecting", channel: "Paid Social", segment: "Prospects", budgetOld: 545_088, budgetNew: 577_575, salesOld: 1_447_518, marginalRoas: 1.93 },
  { id: "pinterest-conversion-prospecting", name: "Pinterest - Conversion - Prospecting", channel: "Paid Social", segment: "Prospects", budgetOld: 247_019, budgetNew: 261_741, salesOld: 2_293_762, marginalRoas: 1.87 },
  { id: "facebook-conversion-remarketing", name: "Facebook - Conversion - Remarketing", channel: "Paid Social", segment: "Customers", budgetOld: 163_274, budgetNew: 173_005, salesOld: 868_888, marginalRoas: 2.68 },
  { id: "reddit-conversion-prospecting", name: "Reddit - Conversion - Prospecting", channel: "Paid Social", segment: "Conversion", budgetOld: 84_501, budgetNew: 89_537, salesOld: 365_085, marginalRoas: 1.92 },
  { id: "snapchat-conversion-prospecting", name: "Snapchat - Conversion - Prospecting", channel: "Paid Social", segment: "Prospects", budgetOld: 68_338, budgetNew: 72_411, salesOld: 333_680, marginalRoas: 2.21 },
].map((t, i) => ({ ...t, logo: LOGO_CYCLE[i % LOGO_CYCLE.length], locked: t.channel === "TV" }));

/** Applies a plan-level budget/sales scenario on top of the real Lulus baseline, so each plan
 * shows plausible, slightly different numbers while staying grounded in the same tactic roster
 * and marginal-return curves — per-tactic reference spend and reference-period sales move with
 * the scenario; marginal ROAS (the underlying response curve) stays as measured. */
function scaleTactics(tactics: Tactic[], budgetScale: number, salesScale: number): Tactic[] {
  return tactics.map((t) => ({
    ...t,
    budgetOld: Math.round(t.budgetOld * budgetScale),
    budgetNew: Math.round(t.budgetNew * budgetScale),
    salesOld: Math.round(t.salesOld * salesScale),
  }));
}

export const INITIAL_TACTICS: Tactic[] = LULUS_TACTICS;

/** Per-plan tactic rosters: the same real Lulus baseline, scaled to a slightly different
 * budget/sales scenario per plan so each one reads as its own plan rather than a repeat. */
export const PLAN_TACTICS: Record<string, Tactic[]> = {
  default: LULUS_TACTICS,
  "sim-default": scaleTactics(LULUS_TACTICS, 1.12, 1.08),
  "sim-q3-inflight": scaleTactics(LULUS_TACTICS, 1.3, 1.18),
  "sim-default-copy": scaleTactics(LULUS_TACTICS, 1.09, 1.06),
};

export const DEFAULT_TARGET_BUDGET = 1_500_000;
