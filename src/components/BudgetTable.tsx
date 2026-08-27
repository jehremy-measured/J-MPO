import { useState } from "react";
import type { PlanTarget } from "../mpo/types";
import { ReturnCurveIcon } from "./icons/BuildPlanIcons";
import { MaterialIcon } from "./icons/MaterialIcon";
import { TacticChartModal } from "./TacticChartModal";
import styles from "./BudgetTable.module.css";

type Props = {
  target: PlanTarget;
  planStart: Date;
  planEnd: Date;
};

type TacticRow = {
  name: string;
  channel: string;
  budget: string;
  sales: string;
  roas: string;
  orders: string;
  cpo: string;
  marginal: string;
};

const rows: TacticRow[] = [
  {
    name: "Google Performance Max",
    channel: "Search",
    budget: "$318,638",
    sales: "$1,234,567",
    roas: "$4.12",
    orders: "8,230",
    cpo: "$38.72",
    marginal: "$5.21",
  },
  {
    name: "Facebook Prospecting",
    channel: "Social",
    budget: "$124,995",
    sales: "$890,000",
    roas: "$3.45",
    orders: "5,933",
    cpo: "$21.07",
    marginal: "$4.80",
  },
  {
    name: "TikTok Prospecting",
    channel: "Social",
    budget: "$98,500",
    sales: "$450,000",
    roas: "$2.90",
    orders: "3,000",
    cpo: "$32.83",
    marginal: "$3.10",
  },
  {
    name: "Bing Non-Brand Search",
    channel: "Search",
    budget: "$45,200",
    sales: "$5,333,463",
    roas: "$2.10",
    orders: "1,205",
    cpo: "$37.51",
    marginal: "$1.95",
  },
  {
    name: "Snapchat Search",
    channel: "Social",
    budget: "$32,000",
    sales: "$120,000",
    roas: "$1.80",
    orders: "800",
    cpo: "$40.00",
    marginal: "$2.00",
  },
];

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

export function BudgetTable({ target, planStart, planEnd }: Props) {
  const [activeTactic, setActiveTactic] = useState<TacticRow | null>(null);
  const showOrders = target === "incremental-orders" || target === "incremental-cpo";
  const primaryLabel = showOrders ? "Incremental Orders" : "Incremental Sales";
  const secondaryLabel = showOrders ? "Incremental CPO" : "Incremental ROAS";
  const marginalLabel = showOrders ? "Marginal CPO" : "Marginal ROAS";
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

  return (
    <section className={styles.section} data-node-id="1:34016">
      <div className={styles.header}>
        <h2>Plan Breakdown</h2>
        <div className={styles.headerControls}>
          <div className={styles.viewToggle}>
            <button type="button">Segments</button>
            <button type="button">Channels</button>
            <button type="button" className={styles.viewActive}>
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
              <th>Tactic</th>
              <th>Budget</th>
              <th>{primaryLabel}</th>
              <th>{secondaryLabel}</th>
              <th>{marginalLabel}</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.totalsRow}>
              <td>
                <strong>Total</strong>
              </td>
              <td>
                <strong>{formatCurrency(totalBudgetValue)}</strong>
              </td>
              <td>
                <strong>{showOrders ? Math.round(totalPrimaryValue).toLocaleString() : formatCurrency(totalPrimaryValue)}</strong>
              </td>
              <td>
                <strong>${aggregateSecondaryValue.toFixed(2)}</strong>
              </td>
              <td />
            </tr>
            {rows.map((row) => (
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
                    <span className={styles.value}>{row.budget}</span>
                    <span className={styles.pctOfTotal}>{formatPercentOfTotal(row.budget, totalBudgetValue)}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.cellStack}>
                    <span className={styles.value}>{showOrders ? row.orders : row.sales}</span>
                    <span className={styles.pctOfTotal}>
                      {formatPercentOfTotal(showOrders ? row.orders : row.sales, totalPrimaryValue)}
                    </span>
                  </div>
                </td>
                <td>
                  <span className={styles.value}>{showOrders ? row.cpo : row.roas}</span>
                </td>
                <td>{row.marginal}</td>
              </tr>
            ))}
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
      />
    </section>
  );
}
