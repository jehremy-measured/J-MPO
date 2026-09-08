import { isModelUpToDate, LATEST_MODEL_DATE, type ModelOption } from "../mpo/modelOptions";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./PlanDialog.module.css";

type Props = {
  /** The plan's current MIM model date, i.e. what "Use current model" resolves to. */
  currentModelDate: string;
  selectedModelId: ModelOption["id"];
  onSelect: (id: ModelOption["id"]) => void;
  /** "created" (default) for the Duplicate-plan dialog, which makes a new plan; "updated" for
   * the Update-model dialog, which changes the existing plan's model in place. */
  verb?: "created" | "updated";
};

/** The "Select model" section shared by the Duplicate-plan and Update-model dialogs. When the
 * plan is already on the latest model there's nothing to choose between, so it collapses to a
 * plain statement instead of a redundant radio choice. */
export function ModelSelectList({ currentModelDate, selectedModelId, onSelect, verb = "created" }: Props) {
  if (isModelUpToDate(currentModelDate)) {
    return (
      <p className={styles.modelPlainText}>
        Plan will be {verb} using data from the latest MIM update ({LATEST_MODEL_DATE}).
      </p>
    );
  }

  return (
    <>
      <div className={styles.sectionLabelRow}>
        <p className={styles.sectionLabel}>Select model data</p>
        <span className={styles.infoBadge} tabIndex={0}>
          <MaterialIcon name="help" size={14} />
          <span className={styles.infoTooltip} role="tooltip">
            Every plan uses model data to create projections.
          </span>
        </span>
      </div>
      <div className={styles.modelList} role="radiogroup" aria-label="Select model data">
        <label className={`${styles.modelRow} ${selectedModelId === "current" ? styles.modelRowSelected : ""}`}>
          <input
            type="radio"
            name="select-model"
            className={styles.radioInput}
            checked={selectedModelId === "current"}
            onChange={() => onSelect("current")}
          />
          <span className={styles.modelBody}>
            <span className={styles.modelDate}>Current plan's model data</span>
            <span className={styles.modelSubtext}>{currentModelDate} MIM update</span>
          </span>
        </label>
        <label className={`${styles.modelRow} ${selectedModelId === "latest" ? styles.modelRowSelected : ""}`}>
          <input
            type="radio"
            name="select-model"
            className={styles.radioInput}
            checked={selectedModelId === "latest"}
            onChange={() => onSelect("latest")}
          />
          <span className={styles.modelBody}>
            <span className={styles.modelDate}>Latest model data</span>
            <span className={styles.modelSubtext}>{LATEST_MODEL_DATE} MIM update</span>
          </span>
        </label>
      </div>
    </>
  );
}
