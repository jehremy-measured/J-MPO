import type { GeoImplementation, GeoTest, GeoTestType } from "./data";
import { PROTOTYPE_TODAY, optimalTestCellSize } from "./data";

export type GeoDesignStep = "tactic" | "type" | "kpi" | "timing" | "cell" | "review" | "done";

export type GeoDesign = {
  tacticId: string | null;
  type: GeoTestType | null;
  kpi: string | null;
  weeks: number;
  start: string;
  cellSize: number;
  implementation: GeoImplementation;
};

export const DESIGN_TACTICS = [
  { id: "meta-asc", name: "Meta Advantage+ Shopping", channel: "Meta", lastTested: "Feb 2026" },
  { id: "google-pmax", name: "Google Performance Max", channel: "Google", lastTested: "Testing now" },
  { id: "youtube-ctv", name: "YouTube CTV", channel: "YouTube", lastTested: "Scheduled" },
  { id: "tiktok-spark", name: "TikTok Spark Ads", channel: "TikTok", lastTested: "Testing now" },
  { id: "pinterest", name: "Pinterest Shopping", channel: "Pinterest", lastTested: "Sep 2026" },
  { id: "snap-prospecting", name: "Snapchat Prospecting", channel: "Snapchat", lastTested: "Jul 2026" },
  { id: "ttd-display", name: "The Trade Desk Display", channel: "The Trade Desk", lastTested: "Never tested" },
] as const;

export const DESIGN_KPIS = ["Online Orders", "Total Orders", "New Customers"] as const;

export const DURATION_OPTIONS = [4, 6, 8] as const;
export const RECOMMENDED_WEEKS = 6;

export const CELL_SIZE_OPTIONS = [5, optimalTestCellSize, 15] as const;

/** Next four Mondays after the prototype "today" (tests start on a Monday) */
export function upcomingStartDates(): string[] {
  const d = parseIso(PROTOTYPE_TODAY);
  d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7) + 7); // leave a week for setup
  return Array.from({ length: 4 }, (_, i) => {
    const next = new Date(d);
    next.setDate(d.getDate() + i * 7);
    return toIso(next);
  });
}

export function initialDesign(): GeoDesign {
  return {
    tacticId: null,
    type: null,
    kpi: null,
    weeks: RECOMMENDED_WEEKS,
    start: upcomingStartDates()[0],
    cellSize: optimalTestCellSize,
    implementation: "Manual",
  };
}

export function tacticFor(design: GeoDesign) {
  return DESIGN_TACTICS.find((t) => t.id === design.tacticId) ?? null;
}

export function endDate(design: GeoDesign) {
  const d = parseIso(design.start);
  d.setDate(d.getDate() + design.weeks * 7 - 1);
  return toIso(d);
}

/** Mock power model: bigger cells and longer tests detect smaller lifts */
export function estimateMde(cellSize: number, weeks: number) {
  return 2.4 * Math.sqrt(optimalTestCellSize / cellSize) * Math.sqrt(RECOMMENDED_WEEKS / weeks);
}

export function marketCount(cellSize: number) {
  return Math.round(cellSize * 2.75);
}

/** Share of in-test-cell revenue at risk while media is paused (holdouts only) */
export function revenueAtRisk(design: GeoDesign) {
  return design.type === "Holdout" ? design.cellSize * 0.06 : 0;
}

export function testName(design: GeoDesign) {
  const tactic = tacticFor(design);
  return `${tactic?.name ?? "New"} ${design.type ?? "Test"}`;
}

export function designToGeoTest(design: GeoDesign, id: number): GeoTest {
  return {
    id,
    name: testName(design),
    multiCell: false,
    contribution: null,
    conversionType: design.kpi ?? "Online Orders",
    type: design.type ?? "Holdout",
    implementation: design.implementation,
    start: design.start,
    end: endDate(design),
    status: "Draft",
  };
}

export function formatDate(iso: string, withYear = true) {
  return parseIso(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear ? { year: "numeric" } : {}),
  });
}

function parseIso(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toIso(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
