import { useState } from "react";
import { CloseIcon } from "./icons/CloseIcon";
import styles from "./DuplicatePlanDialog.module.css";

type ModelTag = "Existing model" | "Latest model";

type ModelOption = {
  id: string;
  date: string;
  tactics: number;
  tag?: ModelTag;
};

// Weekly automatic model refreshes, most recent first. The first two are always shown; the
// rest sit behind "View older models" so the list doesn't overwhelm the default view.
const MODELS: ModelOption[] = [
  { id: "existing", date: "Aug 30, 2026", tactics: 75, tag: "Existing model" },
  { id: "latest", date: "Sep 6, 2026", tactics: 68, tag: "Latest model" },
  { id: "m1", date: "Aug 23, 2026", tactics: 61 },
  { id: "m2", date: "Aug 16, 2026", tactics: 84 },
  { id: "m3", date: "Aug 9, 2026", tactics: 57 },
  { id: "m4", date: "Aug 2, 2026", tactics: 92 },
  { id: "m5", date: "Jul 26, 2026", tactics: 70 },
  { id: "m6", date: "Jul 19, 2026", tactics: 65 },
  { id: "m7", date: "Jul 12, 2026", tactics: 78 },
  { id: "m8", date: "Jul 5, 2026", tactics: 54 },
  { id: "m9", date: "Jun 28, 2026", tactics: 88 },
  { id: "m10", date: "Jun 21, 2026", tactics: 73 },
];

const DEFAULT_VISIBLE = 2;

type Props = {
  planLabel: string;
  onClose: () => void;
  onConfirm: (name: string, model: ModelOption) => void;
};

export function DuplicatePlanDialog({ planLabel, onClose, onConfirm }: Props) {
  const [name, setName] = useState(`${planLabel} variant 1`);
  const [selectedModelId, setSelectedModelId] = useState(MODELS[0].id);
  const [showOlderModels, setShowOlderModels] = useState(false);

  const visibleModels = showOlderModels ? MODELS : MODELS.slice(0, DEFAULT_VISIBLE);

  const handleConfirm = () => {
    const model = MODELS.find((m) => m.id === selectedModelId) ?? MODELS[0];
    onConfirm(name.trim() || `${planLabel} variant 1`, model);
  };

  return (
    <div className={styles.overlay} onMouseDown={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-plan-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h3 id="duplicate-plan-title" className={styles.title}>
            Duplicate this plan
          </h3>
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={onClose}>
            <CloseIcon size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <label className={styles.fieldLabel} htmlFor="duplicate-plan-name">
            Plan name
          </label>
          <input
            id="duplicate-plan-name"
            type="text"
            className={styles.textInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <p className={styles.sectionLabel}>Select model</p>
          <div className={styles.modelList} role="radiogroup" aria-label="Select model">
            {visibleModels.map((model) => (
              <label
                key={model.id}
                className={`${styles.modelRow} ${selectedModelId === model.id ? styles.modelRowSelected : ""}`}
              >
                <input
                  type="radio"
                  name="duplicate-plan-model"
                  className={styles.radioInput}
                  checked={selectedModelId === model.id}
                  onChange={() => setSelectedModelId(model.id)}
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
            <button
              type="button"
              className={styles.viewOlderBtn}
              onClick={() => setShowOlderModels(true)}
            >
              View older models
            </button>
          )}
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={styles.confirmBtn} onClick={handleConfirm}>
            Duplicate
          </button>
        </div>
      </div>
    </div>
  );
}
