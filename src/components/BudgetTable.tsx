import { useMemo, useState } from "react";
import { isAfter, isBefore } from "../mpo/buildPlan/dateUtils";
import { tacticRoasNew, tacticSalesNew } from "../mpo/calc";
import { AVERAGE_ORDER_VALUE, type OptimizationMode, type PlanTarget, type Tactic } from "../mpo/types";
import { ReturnCurveIcon } from "./icons/BuildPlanIcons";
import { MaterialIcon } from "./icons/MaterialIcon";
import { TacticChartModal } from "./TacticChartModal";
import styles from "./BudgetTable.module.css";

type Props = {
  target: PlanTarget;
  planStart: Date;
  planEnd: Date;
  tactics: Tactic[];
  optimizationMode: OptimizationMode;
  /** Forces the tactic popup chart's Actual overlay off — e.g. right after creating a plan. */
  allowActual?: boolean;
};

type TacticRow = {
  name: string;
  channel: string;
  segment: string;
  budget: string;
  sales: string;
  roas: string;
  orders: string;
  cpo: string;
  marginal: string;
};

/** Converts a plan's live Tactic figures into the table's formatted-string row shape. */
function tacticToRow(tactic: Tactic, mode: OptimizationMode): TacticRow {
  const sales = tacticSalesNew(tactic, mode);
  const roas = tacticRoasNew(tactic, mode);
  const orders = Math.round(sales / AVERAGE_ORDER_VALUE);
  const cpo = orders > 0 ? tactic.budgetNew / orders : 0;
  return {
    name: tactic.name,
    channel: tactic.channel,
    segment: tactic.segment,
    budget: `$${Math.round(tactic.budgetNew).toLocaleString()}`,
    sales: `$${Math.round(sales).toLocaleString()}`,
    roas: `$${roas.toFixed(2)}`,
    orders: orders.toLocaleString(),
    cpo: `$${cpo.toFixed(2)}`,
    marginal: `$${tactic.marginalRoas.toFixed(2)}`,
  };
}

function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatPercentOfTotal(value: string, total: number): string {
  if (total <= 0) return "—";
  return `${((parseCurrency(value) / total) * 100).toFixed(1)}%`;
}

function pctOf(value: number, total: number): string {
  if (total <= 0) return "—";
  return `${((value / total) * 100).toFixed(1)}%`;
}

type RowActual = { value: number; good: boolean };

/** Deterministic per-row variance so each row's actual-vs-plan figure looks organic without
 * jittering on every re-render — mirrors the chart's own per-week variance approach, just
 * seeded by row index instead of week index. Budget and the primary metric use different
 * sequences so the two columns don't move in lockstep. */
const ROW_BUDGET_VARIANCE = [0.97, 1.08, 0.92, 1.04, 0.99, 1.06, 0.91, 1.03];
const ROW_VOLUME_VARIANCE = [1.06, 0.94, 1.11, 0.9, 1.05, 0.97, 1.09, 0.93];

/** Budget is a cost metric — coming in under plan is favorable — while the primary volume
 * metric reads as a magnitude to climb toward, so beating plan is favorable. */
function rowActual(planValue: number, index: number, kind: "budget" | "volume"): RowActual {
  const variance =
    kind === "budget"
      ? ROW_BUDGET_VARIANCE[index % ROW_BUDGET_VARIANCE.length]
      : ROW_VOLUME_VARIANCE[index % ROW_VOLUME_VARIANCE.length];
  const value = planValue * variance;
  const higherIsBetter = kind === "volume";
  const good = higherIsBetter ? value >= planValue : value <= planValue;
  return { value, good };
}

/** Actual ROAS/CPO derived from the actual sales-vs-budget ratio, compared against the
 * planned ratio the same way the budget/volume columns compare against their plan figure. */
function ratioActual(actualPrimary: number, actualBudget: number, planRatio: number, showOrders: boolean): RowActual {
  const value = showOrders
    ? actualPrimary > 0
      ? actualBudget / actualPrimary
      : 0
    : actualBudget > 0
      ? actualPrimary / actualBudget
      : 0;
  const higherIsBetter = !showOrders;
  const good = higherIsBetter ? value >= planRatio : value <= planRatio;
  return { value, good };
}

/** The plan/projected figure, colored green/red by whether the actual figure beat it. */
function trendClass(good: boolean): string {
  return `${styles.value} ${good ? styles.trendUp : styles.trendDown}`;
}

/** The actual figure shown under the plan value — plain grey, since the color now lives on
 * the plan figure above it. */
function ActualValue({ value, isCount, isRatio }: { value: number; isCount?: boolean; isRatio?: boolean }) {
  const label = isRatio
    ? `$${value.toFixed(2)}`
    : isCount
      ? Math.round(value).toLocaleString()
      : formatCurrency(value);
  return <span className={styles.actualValue}>{label}</span>;
}

type GroupRow = {
  name: string;
  budget: number;
  sales: number;
  orders: number;
};

/** Groups tactic rows by channel or segment, summing their formatted-string figures. Shared by
 * the Channels and Segments views since both are just a different grouping key on the same rows. */
function buildGroupedRows(tacticRows: TacticRow[], key: "channel" | "segment"): GroupRow[] {
  const byKey = new Map<string, GroupRow>();
  for (const row of tacticRows) {
    const name = row[key];
    const existing = byKey.get(name) ?? { name, budget: 0, sales: 0, orders: 0 };
    existing.budget += parseCurrency(row.budget);
    existing.sales += parseCurrency(row.sales);
    existing.orders += parseCurrency(row.orders);
    byKey.set(name, existing);
  }
  return [...byKey.values()];
}

type BudgetTableView = "segments" | "channels" | "tactics";

export function BudgetTable({ target, planStart, planEnd, tactics, optimizationMode, allowActual = true }: Props) {
  const [view, setView] = useState<BudgetTableView>("channels");
  const [activeTactic, setActiveTactic] = useState<TacticRow | null>(null);
  const today = new Date();
  const actualsAvailable = allowActual && !isBefore(today, planStart) && !isAfter(today, planEnd);
  const showOrders = target === "incremental-orders" || target === "incremental-cpo";
  const primaryLabel = showOrders ? "Incremental Orders" : "Incremental Sales";
  const secondaryLabel = showOrders ? "Incremental CPO" : "Incremental ROAS";
  const marginalLabel = showOrders ? "Marginal CPO" : "Marginal ROAS";

  const rows = useMemo(
    () => tactics.map((tactic) => tacticToRow(tactic, optimizationMode)),
    [tactics, optimizationMode]
  );
  const channelRows = useMemo(() => buildGroupedRows(rows, "channel"), [rows]);
  const segmentRows = useMemo(() => buildGroupedRows(rows, "segment"), [rows]);
  const groupRows = view === "segments" ? segmentRows : channelRows;

  const totalBudgetValue = rows.reduce((sum, row) => sum + parseCurrency(row.budget), 0);
  const totalPrimaryValue = rows.reduce(
    (sum, row) => sum + parseCurrency(showOrders ? row.orders : row.sales),
    0
  );
  // Budget and the primary volume metric sum directly across tactics; ROAS/CPO are ratios, so
  // the aggregate is recomputed from the summed totals rather than averaged row by row.
  const aggregateSecondaryValue = showOrders
    ? totalBudgetValue / (totalPrimaryValue || 1)
    : totalPrimaryValue / (totalBudgetValue || 1);

  // The totals row's actual figures are the sum of whichever rows are currently displayed
  // (channels, segments, or tactics) — each row's own actual-vs-plan variance, added up.
  const viewRows =
    view === "tactics"
      ? rows.map((row) => ({
          budget: parseCurrency(row.budget),
          primary: parseCurrency(showOrders ? row.orders : row.sales),
        }))
      : groupRows.map((row) => ({ budget: row.budget, primary: showOrders ? row.orders : row.sales }));
  const totalBudgetActual = viewRows.reduce(
    (sum, row, i) => sum + rowActual(row.budget, i, "budget").value,
    0
  );
  const totalPrimaryActual = viewRows.reduce(
    (sum, row, i) => sum + rowActual(row.primary, i, "volume").value,
    0
  );
  const totalBudgetActualGood = totalBudgetActual <= totalBudgetValue;
  const totalPrimaryActualGood = totalPrimaryActual >= totalPrimaryValue;
  const totalSecondaryActual = ratioActual(totalPrimaryActual, totalBudgetActual, aggregateSecondaryValue, showOrders);

  return (
    <section className={styles.section} data-node-id="1:34016">
      <div className={styles.header}>
        <h2>Plan Breakdown</h2>
        <div className={styles.headerControls}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={view === "segments" ? styles.viewActive : undefined}
              onClick={() => setView("segments")}
            >
              Segments
            </button>
            <button
              type="button"
              className={view === "channels" ? styles.viewActive : undefined}
              onClick={() => setView("channels")}
            >
              Channels
            </button>
            <button
              type="button"
              className={view === "tactics" ? styles.viewActive : undefined}
              onClick={() => setView("tactics")}
            >
              Tactics
            </button>
          </div>
          <input className={styles.search} type="search" placeholder="Search" />
          <button type="button" className={`${styles.textBtn} ${styles.textBtnChevron}`}>
            Options
            <MaterialIcon name="expand_more" size={18} />
          </button>
          <button type="button" className={styles.textBtn}>
            <MaterialIcon name="file_upload" size={18} />
            Export
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>{view === "channels" ? "Channel" : view === "segments" ? "Segment" : "Tactic"}</th>
              <th>Budget</th>
              <th>{primaryLabel}</th>
              <th>{secondaryLabel}</th>
              <th>{marginalLabel}</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.totalsRow}>
              <td>
                <span className={styles.totalValue}>Total</span>
              </td>
              <td>
                <div className={styles.cellStack}>
                  <span className={actualsAvailable ? `${styles.totalValue} ${totalBudgetActualGood ? styles.trendUp : styles.trendDown}` : styles.totalValue}>
                    {formatCurrency(totalBudgetValue)}
                  </span>
                  {actualsAvailable && <ActualValue value={totalBudgetActual} />}
                </div>
              </td>
              <td>
                <div className={styles.cellStack}>
                  <span className={actualsAvailable ? `${styles.totalValue} ${totalPrimaryActualGood ? styles.trendUp : styles.trendDown}` : styles.totalValue}>
                    {showOrders ? Math.round(totalPrimaryValue).toLocaleString() : formatCurrency(totalPrimaryValue)}
                  </span>
                  {actualsAvailable && <ActualValue value={totalPrimaryActual} isCount={showOrders} />}
                </div>
              </td>
              <td>
                <div className={styles.cellStack}>
                  <span className={actualsAvailable ? `${styles.totalValue} ${totalSecondaryActual.good ? styles.trendUp : styles.trendDown}` : styles.totalValue}>
                    ${aggregateSecondaryValue.toFixed(2)}
                  </span>
                  {actualsAvailable && <ActualValue value={totalSecondaryActual.value} isRatio />}
                </div>
              </td>
              <td />
            </tr>
            {view !== "tactics"
              ? groupRows.map((row, i) => {
                  const primaryValue = showOrders ? row.orders : row.sales;
                  const secondaryValue = showOrders
                    ? row.budget / (row.orders || 1)
                    : row.sales / (row.budget || 1);
                  const budgetActual = rowActual(row.budget, i, "budget");
                  const primaryActual = rowActual(primaryValue, i, "volume");
                  const secondaryActual = ratioActual(primaryActual.value, budgetActual.value, secondaryValue, showOrders);
                  return (
                    <tr key={row.name}>
                      <td>
                        <div className={styles.tacticCell}>
                          <span className={styles.logoPlaceholder} aria-hidden>
                            {row.name.charAt(0)}
                          </span>
                          <div className={styles.tacticName}>{row.name}</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellStack}>
                          <span className={actualsAvailable ? trendClass(budgetActual.good) : styles.value}>
                            {formatCurrency(row.budget)}
                          </span>
                          {actualsAvailable ? (
                            <ActualValue value={budgetActual.value} />
                          ) : (
                            <span className={styles.pctOfTotal}>{pctOf(row.budget, totalBudgetValue)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellStack}>
                          <span className={actualsAvailable ? trendClass(primaryActual.good) : styles.value}>
                            {showOrders ? Math.round(primaryValue).toLocaleString() : formatCurrency(primaryValue)}
                          </span>
                          {actualsAvailable ? (
                            <ActualValue value={primaryActual.value} isCount={showOrders} />
                          ) : (
                            <span className={styles.pctOfTotal}>{pctOf(primaryValue, totalPrimaryValue)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellStack}>
                          <span className={actualsAvailable ? trendClass(secondaryActual.good) : styles.value}>
                            ${secondaryValue.toFixed(2)}
                          </span>
                          {actualsAvailable && <ActualValue value={secondaryActual.value} isRatio />}
                        </div>
                      </td>
                      <td>—</td>
                    </tr>
                  );
                })
              : rows.map((row, i) => {
                  const budgetActual = rowActual(parseCurrency(row.budget), i, "budget");
                  const primaryActual = rowActual(parseCurrency(showOrders ? row.orders : row.sales), i, "volume");
                  const planRatio = parseCurrency(showOrders ? row.cpo : row.roas);
                  const secondaryActual = ratioActual(primaryActual.value, budgetActual.value, planRatio, showOrders);
                  return (
                    <tr key={row.name}>
                      <td>
                        <div className={styles.tacticCell}>
                          <span className={styles.logoPlaceholder} aria-hidden>
                            {row.name.charAt(0)}
                          </span>
                          <div>
                            <div className={styles.tacticName}>{row.name}</div>
                            <div className={styles.tacticChannel}>{row.channel}</div>
                          </div>
                          <button
                            type="button"
                            className={styles.sparkline}
                            aria-label={`View projections by week for ${row.name}`}
                            onClick={() => setActiveTactic(row)}
                          >
                            <ReturnCurveIcon size={20} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellStack}>
                          <span className={actualsAvailable ? trendClass(budgetActual.good) : styles.value}>
                            {row.budget}
                          </span>
                          {actualsAvailable ? (
                            <ActualValue value={budgetActual.value} />
                          ) : (
                            <span className={styles.pctOfTotal}>{formatPercentOfTotal(row.budget, totalBudgetValue)}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellStack}>
                          <span className={actualsAvailable ? trendClass(primaryActual.good) : styles.value}>
                            {showOrders ? row.orders : row.sales}
                          </span>
                          {actualsAvailable ? (
                            <ActualValue value={primaryActual.value} isCount={showOrders} />
                          ) : (
                            <span className={styles.pctOfTotal}>
                              {formatPercentOfTotal(showOrders ? row.orders : row.sales, totalPrimaryValue)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.cellStack}>
                          <span className={actualsAvailable ? trendClass(secondaryActual.good) : styles.value}>
                            {showOrders ? row.cpo : row.roas}
                          </span>
                          {actualsAvailable && <ActualValue value={secondaryActual.value} isRatio />}
                        </div>
                      </td>
                      <td>{row.marginal}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      <TacticChartModal
        open={activeTactic != null}
        tacticName={activeTactic?.name ?? ""}
        channel={activeTactic?.channel ?? ""}
        planStart={planStart}
        planEnd={planEnd}
        totalBudget={activeTactic ? parseCurrency(activeTactic.budget) : 0}
        volumeMetric={activeTactic ? parseCurrency(showOrders ? activeTactic.orders : activeTactic.sales) : 0}
        volumeNoun={showOrders ? "Orders" : "Sales"}
        isOrdersFamily={showOrders}
        onClose={() => setActiveTactic(null)}
        allowActual={allowActual}
      />
    </section>
  );
}
