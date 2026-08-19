import { useState } from "react";
import { formatShortDate } from "../mpo/buildPlan/dateUtils";
import type { Plan } from "../mpo/types";
import { ReturnCurveIcon, WrenchIcon } from "./icons/BuildPlanIcons";
import styles from "./PlansTable.module.css";

type Props = {
  plans: Plan[];
  onOpenPlan: (id: string) => void;
};

const KIND_LABEL: Record<Plan["kind"], string> = {
  optimization: "Optimization",
  simulation: "Simulation",
};

function KindIcon({ kind }: { kind: Plan["kind"] }) {
  return (
    <span className={`${styles.kindIcon} ${kind === "optimization" ? styles.kindOptimization : styles.kindSimulation}`}>
      {kind === "optimization" ? <WrenchIcon size={13} /> : <ReturnCurveIcon size={13} />}
    </span>
  );
}

export function PlansTable({ plans, onOpenPlan }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const allSelected = plans.length > 0 && selected.size === plans.length;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(plans.map((p) => p.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Plans</h2>
        {selected.size > 0 && <span className={styles.selectedCount}>{selected.size} selected</span>}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCol}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all plans"
                />
              </th>
              <th>Plan name</th>
              <th>Created by</th>
              <th>Last edited</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan) => (
              <tr key={plan.id} className={styles.row}>
                <td className={styles.checkboxCol}>
                  <input
                    type="checkbox"
                    checked={selected.has(plan.id)}
                    onChange={() => toggleOne(plan.id)}
                    aria-label={`Select ${plan.label}`}
                  />
                </td>
                <td>
                  <button type="button" className={styles.nameCell} onClick={() => onOpenPlan(plan.id)}>
                    <KindIcon kind={plan.kind} />
                    <span className={styles.nameText}>{plan.label}</span>
                  </button>
                </td>
                <td>{plan.createdBy}</td>
                <td>{formatShortDate(plan.lastEdited)}</td>
                <td>
                  <span className={`${styles.badge} ${plan.kind === "optimization" ? styles.badgeOptimization : styles.badgeSimulation}`}>
                    {KIND_LABEL[plan.kind]}
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
