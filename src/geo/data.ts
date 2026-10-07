export type GeoTestStatus = "Draft" | "Scheduled" | "In Progress" | "Complete";
export type GeoTestType = "Holdout" | "Scale";
export type GeoImplementation = "Manual" | "Automated";

export type GeoTest = {
  id: number;
  name: string;
  /** Multi-cell tests show the stacked-layers icon next to the name */
  multiCell: boolean;
  /** Incremental contribution %, only known once a test has read out */
  contribution: number | null;
  conversionType: string;
  type: GeoTestType;
  implementation: GeoImplementation;
  /** ISO dates (yyyy-mm-dd) */
  start: string;
  end: string;
  status: GeoTestStatus;
};

export type GeoFilter = "All" | "Draft" | "Scheduled" | "In Progress" | "Finished";

export const GEO_FILTERS: GeoFilter[] = ["All", "Draft", "Scheduled", "In Progress", "Finished"];

export const FILTER_STATUS: Record<Exclude<GeoFilter, "All">, GeoTestStatus> = {
  Draft: "Draft",
  Scheduled: "Scheduled",
  "In Progress": "In Progress",
  Finished: "Complete",
};

/** Header KPI cards */
export const testCells = { available: 3, total: 4 };
export const optimalTestCellSize = 9.9;

/** Prototype "today" — keeps progress bars stable regardless of when the demo runs */
export const PROTOTYPE_TODAY = "2026-10-07";

export const geoTests: GeoTest[] = [
  {
    id: 12204,
    name: "Meta Advantage+ Scale",
    multiCell: false,
    contribution: null,
    conversionType: "Online Orders",
    type: "Scale",
    implementation: "Automated",
    start: "2026-11-02",
    end: "2026-12-14",
    status: "Draft",
  },
  {
    id: 12187,
    name: "YouTube CTV Holdout",
    multiCell: false,
    contribution: null,
    conversionType: "Total Orders",
    type: "Holdout",
    implementation: "Manual",
    start: "2026-10-19",
    end: "2026-11-30",
    status: "Scheduled",
  },
  {
    id: 12153,
    name: "Google PMax Holdout",
    multiCell: false,
    contribution: null,
    conversionType: "Online Orders",
    type: "Holdout",
    implementation: "Automated",
    start: "2026-09-14",
    end: "2026-10-26",
    status: "In Progress",
  },
  {
    id: 12098,
    name: "TikTok Spark Ads Scale",
    multiCell: true,
    contribution: null,
    conversionType: "New Customers",
    type: "Scale",
    implementation: "Manual",
    start: "2026-09-01",
    end: "2026-10-13",
    status: "In Progress",
  },
  {
    id: 11947,
    name: "Pinterest Multi Tactic",
    multiCell: true,
    contribution: 0.94,
    conversionType: "Online Orders",
    type: "Holdout",
    implementation: "Manual",
    start: "2026-08-11",
    end: "2026-09-23",
    status: "Complete",
  },
  {
    id: 11802,
    name: "Snapchat Prospecting Holdout",
    multiCell: false,
    contribution: 2.31,
    conversionType: "Online Orders",
    type: "Holdout",
    implementation: "Automated",
    start: "2026-06-08",
    end: "2026-07-20",
    status: "Complete",
  },
  {
    id: 11655,
    name: "Bing Brand Search Holdout",
    multiCell: false,
    contribution: 0.41,
    conversionType: "Total Orders",
    type: "Holdout",
    implementation: "Manual",
    start: "2026-04-13",
    end: "2026-05-25",
    status: "Complete",
  },
  {
    id: 11420,
    name: "Meta Retargeting Scale",
    multiCell: true,
    contribution: 5.62,
    conversionType: "Online Orders",
    type: "Scale",
    implementation: "Automated",
    start: "2026-02-02",
    end: "2026-03-16",
    status: "Complete",
  },
];
