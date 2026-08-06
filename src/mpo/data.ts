import { assets } from "../assets/figma";
import type { Plan, Tactic } from "./types";

export const PLANS: Plan[] = [
  { id: "default", label: "Default Plan" },
  { id: "q1-2025", label: "Optimized budget Q1 2025" },
  { id: "quick", label: "Quick calc" },
  { id: "trevor", label: "Trevor's plan" },
  { id: "quarterly", label: "Quarterly Expense Tracker" },
  { id: "q3-2024", label: "Q3 2024 scenario" },
  { id: "pacing", label: "My Plan & Pacing" },
  { id: "test-2026", label: "Test Plan 2026" },
];

export const INITIAL_TACTICS: Tactic[] = [
  {
    id: "gpm",
    name: "Google Performance Max",
    channel: "Search",
    logo: assets.google,
    budgetOld: 243_988,
    budgetNew: 318_638,
    locked: false,
    salesOld: 1_100_000,
    marginalRoas: 5.21,
  },
  {
    id: "fb",
    name: "Facebook Prospecting",
    channel: "Social",
    logo: assets.meta,
    budgetOld: 111_245,
    budgetNew: 124_995,
    locked: false,
    salesOld: 850_000,
    marginalRoas: 4.8,
  },
  {
    id: "tiktok",
    name: "TikTok Prospecting",
    channel: "Social",
    logo: assets.tiktok,
    budgetOld: 98_500,
    budgetNew: 98_500,
    locked: true,
    salesOld: 450_000,
    marginalRoas: 3.1,
  },
  {
    id: "bing",
    name: "Bing Non-Brand Search",
    channel: "Search",
    logo: assets.bing,
    budgetOld: 51_096,
    budgetNew: 45_200,
    locked: false,
    salesOld: 5_400_000,
    marginalRoas: 1.95,
  },
  {
    id: "snap",
    name: "Snapchat Search",
    channel: "Social",
    logo: assets.snapchat,
    budgetOld: 32_000,
    budgetNew: 32_000,
    locked: true,
    salesOld: 120_000,
    marginalRoas: 2.0,
  },
];

export const DEFAULT_TARGET_BUDGET = 1_500_000;
