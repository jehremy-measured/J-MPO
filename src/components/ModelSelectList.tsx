import { useState } from "react";
import { DEFAULT_VISIBLE_MODELS, MODELS } from "../mpo/modelOptions";
import styles from "./PlanDialog.module.css";

type Props = {
  selectedModelId: string;
  onSelect: (id: string) => void;
};

/** The "Select model" section shared by the Duplicate-plan and Update-model dialogs: a radio
 * list of weekly model refreshes with a "View older models" toggle to reveal the rest. */
export function ModelSelectList({ selectedModelId, onSelect }: Props) {
  const [showOlderModels, setShowOlderModels] = useState(false);
  const visibleModels = showOlderModels ? MODELS : MODELS.slice(0, DEFAULT_VISIBLE_MODELS);

  return (
    <>
      <p className={styles.sectionLabel}>Select model</p>
      <div className={styles.modelList} role="radiogroup" aria-label="Select model">
        {visibleModels.map((model) => (
          <label
            key={model.id}
            className={`${styles.modelRow} ${selectedModelId === model.id ? styles.modelRowSelected : ""}`}
          >
            <input
              type="radio"
              name="select-model"
              className={styles.radioInput}
              checked={selectedModelId === model.id}
              onChange={() => onSelect(model.id)}
            />
            <span className={styles.modelBody}>
              <span className={styles.modelTitleRow}>
                <span className={styles.modelDate}>{model.date}</span>
                {model.tag && (
                  <span
                    className={`${styles.tag} ${
                      model.tag === "Existing model" ? styles.tagExisting : styles.tagLatest
                    }`}
                  >
                    {model.tag}
                  </span>
                )}
              </span>
              <span className={styles.modelSubtext}>Automatic update • {model.tactics} tactic updates</span>
            </span>
          </label>
        ))}
      </div>

      {!showOlderModels && (
        <button type="button" className={styles.viewOlderBtn} onClick={() => setShowOlderModels(true)}>
          View older models
        </button>
      )}
    </>
  );
}
