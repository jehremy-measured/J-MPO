import { ReturnCurveIcon } from "./icons/BuildPlanIcons";
import styles from "./BudgetTable.module.css";

type TacticRow = {
  name: string;
  channel: string;
  budget: string;
  sales: string;
  salesUp: boolean;
  roas: string;
  roasUp: boolean;
  marginal: string;
};

const rows: TacticRow[] = [
  {
    name: "Google Performance Max",
    channel: "Search",
    budget: "$318,638",
    sales: "$1,234,567",
    salesUp: true,
    roas: "$4.12",
    roasUp: true,
    marginal: "$5.21",
  },
  {
    name: "Facebook Prospecting",
    channel: "Social",
    budget: "$124,995",
    sales: "$890,000",
    salesUp: true,
    roas: "$3.45",
    roasUp: true,
    marginal: "$4.80",
  },
  {
    name: "TikTok Prospecting",
    channel: "Social",
    budget: "$98,500",
    sales: "$450,000",
    salesUp: true,
    roas: "$2.90",
    roasUp: true,
    marginal: "$3.10",
  },
  {
    name: "Bing Non-Brand Search",
    channel: "Search",
    budget: "$45,200",
    sales: "$5,333,463",
    salesUp: false,
    roas: "$2.10",
    roasUp: false,
    marginal: "$1.95",
  },
  {
    name: "Snapchat Search",
    channel: "Social",
    budget: "$32,000",
    sales: "$120,000",
    salesUp: true,
    roas: "$1.80",
    roasUp: true,
    marginal: "$2.00",
  },
];

function parseCurrency(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, "")) || 0;
}

function formatPercentOfTotal(value: string, total: number): string {
  if (total <= 0) return "—";
  return `${((parseCurrency(value) / total) * 100).toFixed(1)}%`;
}

export function BudgetTable() {
  const totalBudgetValue = rows.reduce((sum, row) => sum + parseCurrency(row.budget), 0);
  const totalSalesValue = rows.reduce((sum, row) => sum + parseCurrency(row.sales), 0);


  return (
    <section className={styles.section} data-node-id="1:34016">
      <div className={styles.header}>
        <h2>Budget Recommendations</h2>
        <div className={styles.headerControls}>
          <div className={styles.viewToggle}>
            <button type="button">Segments</button>
            <button type="button">Channels</button>
            <button type="button" className={styles.viewActive}>
              Tactics
            </button>
          </div>
          <input className={styles.search} type="search" placeholder="Search" />
          <button type="button" className={styles.iconBtn} aria-label="Layout">
            ⊞
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Export">
            ↑
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tactic</th>
              <th>Budget</th>
              <th>Incremental Sales</th>
              <th>Incremental ROAS</th>
              <th>Marginal ROAS</th>
              <th>Return Curve</th>
            </tr>
          </thead>
          <tbody>
            <tr className={styles.totalsRow}>
              <td>
                <strong>Total</strong>
              </td>
              <td>
                <strong>$9,394,384</strong>
              </td>
              <td>
                <strong>$12.34</strong>
              </td>
              <td>
                <strong>$9.11</strong>
              </td>
              <td>
                <strong>$10,999,283</strong>
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
                  </div>
                </td>
                <td>
                  <div className={styles.cellStack}>
                    <span className={styles.valueTeal}>{row.budget}</span>
                    <span className={styles.pctOfTotal}>{formatPercentOfTotal(row.budget, totalBudgetValue)}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.cellStack}>
                    <span className={row.salesUp ? styles.valueTeal : styles.valueRed}>
                      {row.sales}
                    </span>
                    <span className={styles.pctOfTotal}>{formatPercentOfTotal(row.sales, totalSalesValue)}</span>
                  </div>
                </td>
                <td>
                  <span className={row.roasUp ? styles.valueTeal : styles.valueRed}>
                    {row.roas}
                  </span>
                </td>
                <td>{row.marginal}</td>
                <td>
                  <span className={styles.sparkline} aria-hidden>
                    <ReturnCurveIcon size={20} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
