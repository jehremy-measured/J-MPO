import type { MiaPrompt } from "../components/MiaSidePanel";
import type { GeoTest } from "./data";

export const GEO_MIA_PROMPTS: MiaPrompt[] = [
  {
    label: "Design a new geo test",
    description: "Pick a tactic and I'll size the test cell, timing and markets for you.",
    action: "flow",
  },
  {
    label: "Summarize my latest test result",
    description: "Get a plain-language readout of the most recent completed test.",
    action: "chat",
  },
  {
    label: "What should I test next?",
    description: "See which tactics carry the most spend with the least test coverage.",
    action: "chat",
  },
  {
    label: "How are my live tests tracking?",
    description: "Check progress and readout dates for tests in flight.",
    action: "chat",
  },
];

export function shouldStartGeoDesignFlow(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    /(design|create|set ?up|build|start|plan)\b.*\b(test|experiment|holdout)/.test(lower) ||
    lower === "new test"
  );
}

const shortDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/** Canned, data-aware prototype replies for the Geo Tests page */
export function geoMiaReply(input: string, tests: GeoTest[]): string {
  const lower = input.toLowerCase();

  if (lower.includes("summar") || lower.includes("result") || lower.includes("latest")) {
    const latest = tests
      .filter((t) => t.status === "Complete")
      .sort((a, b) => b.end.localeCompare(a.end))[0];
    if (!latest) return "You don't have a completed test yet — results show up here once one finalizes.";
    return `${latest.name} (ID ${latest.id}) finished ${shortDate(latest.end)}. It drove ${latest.contribution?.toFixed(
      2
    )}% of ${latest.conversionType.toLowerCase()} incrementally — a ${latest.type.toLowerCase()} read across ${
      latest.multiCell ? "multiple test cells" : "a single test cell"
    }. Open the row for confidence intervals and the iROAS calibration it fed into MIM.`;
  }

  if (lower.includes("next") || lower.includes("recommend") || lower.includes("should i test")) {
    return "The Trade Desk Display has never been geo tested and is ~11% of spend — it's the biggest blind spot. Meta Advantage+ was last read in February, so a refresh is due too. Say \"Design a new geo test\" and I'll set one up.";
  }

  if (lower.includes("live") || lower.includes("tracking") || lower.includes("progress") || lower.includes("in flight")) {
    const live = tests.filter((t) => t.status === "In Progress");
    if (!live.length) return "Nothing is live right now.";
    const lines = live.map((t) => `${t.name} ends ${shortDate(t.end)}`).join("; ");
    return `${live.length} test${live.length > 1 ? "s are" : " is"} live: ${lines}. Results finalize about 8 days after each end date. Both are pacing on plan with no market contamination flagged.`;
  }

  if (lower.includes("cell") || lower.includes("optimal") || lower.includes("size")) {
    return "Your optimal test cell size is 9.90% of national sales — large enough to detect a ~2.4% lift over 6 weeks at 80% power. You have 3 of 4 test cells available, so you can run up to 3 more tests in parallel.";
  }

  if (lower.includes("holdout") || lower.includes("scale")) {
    return "A holdout pauses media in test markets to measure what it drives today; a scale test heavies-up spend to find the return on the next dollar. Use holdouts to validate a tactic, scale tests to justify more budget.";
  }

  return 'I can design a new geo test, summarize results, or check on live tests — try "Design a new geo test".';
}
