import { isModelUpToDate, LATEST_MODEL_DATE, type ModelOption } from "../mpo/modelOptions";
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
      <p className={styles.sectionLabel}>Select model</p>
      <div className={styles.modelList} role="radiogroup" aria-label="Select model">
        <label className={`${styles.modelRow} ${selectedModelId === "current" ? styles.modelRowSelected : ""}`}>
          <input
            type="radio"
            name="select-model"
            className={styles.radioInput}
            checked={selectedModelId === "current"}
            onChange={() => onSelect("current")}
          />
          <span className={styles.modelBody}>
            <span className={styles.modelDate}>Use current model</span>
            <span className={styles.modelSubtext}>
              Plan will be {verb} using the same MIM data ({currentModelDate}) as your current plan.
            </span>
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
            <span className={styles.modelDate}>Use latest model</span>
            <span className={styles.modelSubtext}>
              Plan will be {verb} using data from the latest MIM update ({LATEST_MODEL_DATE}).
            </span>
          </span>
        </label>
      </div>
    </>
  );
}
