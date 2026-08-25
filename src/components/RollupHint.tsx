import type { ConversionTypeOption } from "../mpo/buildPlan/types";
import { CT_LOOKUP } from "../mpo/buildPlan/data";
import { LayersIcon } from "./icons/BuildPlanIcons";
import styles from "./RollupHint.module.css";

/** Small stacked-layers badge shown next to a roll-up conversion type; hovering (or
 * focusing, for keyboard users) reveals which baseline types it aggregates. */
export function RollupHint({ item }: { item: ConversionTypeOption }) {
  if (!item.rollupOf?.length) return null;
  const names = item.rollupOf.map((id) => CT_LOOKUP[id] ?? id);
  return (
    <span className={styles.badge} tabIndex={0}>
      <LayersIcon size={14} />
      <span className={styles.tooltip} role="tooltip">
        <strong>Roll-up of</strong>
        {names.join(", ")}
      </span>
    </span>
  );
}
