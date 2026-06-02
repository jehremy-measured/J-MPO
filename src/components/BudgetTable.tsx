import { assets } from "../assets/figma";
import styles from "./BudgetTable.module.css";

type TacticRow = {
  name: string;
  channel: string;
  logo: string;
  budgetNew: string;
  budgetOld: string;
  adjustment: string;
  adjustmentUp: boolean;
  locked?: boolean;
  salesNew: string;
  salesOld: string;
  salesUp: boolean;
  roasNew: string;
  roasOld: string;
  roasUp: boolean;
  marginal: string;
};

const rows: TacticRow[] = [
  {
    name: "Google Performance Max",
    channel: "Search",
    logo: assets.google,
    budgetNew: "$318,638",
    budgetOld: "$243,988",
    adjustment: "$3,426",
    adjustmentUp: true,
    salesNew: "$1,234,567",
    salesOld: "$1,100,000",
    salesUp: true,
    roasNew: "$4.12",
    roasOld: "$3.98",
    roasUp: true,
    marginal: "$5.21",
  },
  {
    name: "Facebook Prospecting",
    channel: "Social",
    logo: assets.meta,
    budgetNew: "$124,995",
    budgetOld: "$111,245",
    adjustment: "$2,100",
    adjustmentUp: true,
    salesNew: "$890,000",
    salesOld: "$850,000",
    salesUp: true,
    roasNew: "$3.45",
    roasOld: "$3.20",
    roasUp: true,
    marginal: "$4.80",
  },
  {
    name: "TikTok Prospecting",
    channel: "Social",
    logo: assets.tiktok,
    budgetNew: "$98,500",
    budgetOld: "$98,500",
    adjustment: "$0",
    adjustmentUp: true,
    locked: true,
    salesNew: "$450,000",
    salesOld: "$450,000",
    salesUp: true,
    roasNew: "$2.90",
    roasOld: "$2.90",
    roasUp: true,
    marginal: "$3.10",
  },
  {
    name: "Bing Non-Brand Search",
    channel: "Search",
    logo: assets.bing,
    budgetNew: "$45,200",
    budgetOld: "$51,096",
    adjustment: "$5,896",
    adjustmentUp: false,
    salesNew: "$5,333,463",
    salesOld: "$5,400,000",
    salesUp: false,
    roasNew: "$2.10",
    roasOld: "$2.25",
    roasUp: false,
    marginal: "$1.95",
  },
  {
    name: "Snapchat Search",
    channel: "Social",
    logo: assets.snapchat,
    budgetNew: "$32,000",
    budgetOld: "$32,000",
    adjustment: "$0",
    adjustmentUp: true,
    locked: true,
    salesNew: "$120,000",
    salesOld: "$120,000",
    salesUp: true,
    roasNew: "$1.80",
    roasOld: "$1.80",
    roasUp: true,
    marginal: "$2.00",
  },
];

export function BudgetTable() {
  return (
    <section className={styles.section} data-node-id="1:34016">
      <div className={styles.header}>
        <h2>Budget Recommendations</h2>
        <div className={styles.headerControls}>
          <select className={styles.select} defaultValue="us">
            <option value="us">US Online Orders</option>
          </select>
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

      <div className={styles.banner}>
        <span aria-hidden>📣</span>
        It&apos;s a big season — let us help! Connect with your CS rep to confirm
        your MPO budget plan is accurate and ready to activate.
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tactic</th>
              <th>Budget</th>
              <th>Budget Adjustments</th>
              <th>Incremental Sales</th>
              <th>Incremental ROAS</th>
              <th>Marginal ROAS</th>
              <th>Return Curve</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td>
                  <div className={styles.tacticCell}>
                    <img src={row.logo} alt="" className={styles.logo} />
                    <div>
                      <div className={styles.tacticName}>{row.name}</div>
                      <div className={styles.tacticChannel}>{row.channel}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.stack}>
                    <span className={styles.valueTeal}>{row.budgetNew}</span>
                    <span className={styles.valueMuted}>{row.budgetOld}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.adjustCell}>
                    <div className={styles.adjustBar}>
                      <span
                        className={
                          row.adjustmentUp
                            ? styles.adjustFillUp
                            : styles.adjustFillDown
                        }
                        style={{ width: row.locked ? "0%" : "55%" }}
                      />
                    </div>
                    <span
                      className={
                        row.adjustmentUp ? styles.changeUp : styles.changeDown
                      }
                    >
                      {row.adjustmentUp ? "↑" : "↓"} {row.adjustment}
                    </span>
                    {row.locked && (
                      <img src={assets.lock} alt="Locked" className={styles.lock} />
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.stack}>
                    <span className={row.salesUp ? styles.valueTeal : styles.valueRed}>
                      {row.salesNew}
                    </span>
                    <span className={styles.valueMuted}>{row.salesOld}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.stack}>
                    <span className={row.roasUp ? styles.valueTeal : styles.valueRed}>
                      {row.roasNew}
                    </span>
                    <span className={styles.valueMuted}>{row.roasOld}</span>
                  </div>
                </td>
                <td>{row.marginal}</td>
                <td>
                  <img src={assets.sparkline} alt="" className={styles.sparkline} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td>
                <strong>$9,394,384</strong>
              </td>
              <td />
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
          </tfoot>
        </table>
      </div>
    </section>
  );
}
