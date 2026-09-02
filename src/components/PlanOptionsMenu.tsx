import { useEffect, useRef, useState } from "react";
import { isOnLatestModel } from "../mpo/modelOptions";
import { ConfirmDialog } from "./ConfirmDialog";
import { ChevronDownIcon, DownloadIcon, DuplicateIcon, EditIcon, TrashIcon } from "./icons/BuildPlanIcons";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./PlanOptionsMenu.module.css";

type Props = {
  planId: string;
  planLabel: string;
  shared?: boolean;
  onRenameRequest?: () => void;
  onToggleSharePlan?: (id: string) => void;
  onDuplicatePlan?: (id: string) => void;
  onExportPlan?: () => void;
  onDeletePlan?: (id: string) => void;
  onUpdateModel?: () => void;
  currentModelLabel?: string;
  /** "button" is the labeled "More" pill; "chevron" is a bare chevron-only trigger meant to sit
   * directly beside a title. */
  variant?: "button" | "chevron";
  /** For the "chevron" variant: renders this text before the chevron inside the same trigger,
   * so the title itself (not just the chevron) is hoverable and opens the menu on click. */
  title?: string;
};

export function PlanOptionsMenu({
  planId,
  planLabel,
  shared,
  onRenameRequest,
  onToggleSharePlan,
  onDuplicatePlan,
  onExportPlan,
  onDeletePlan,
  onUpdateModel,
  currentModelLabel,
  variant = "button",
  title,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  if (!onRenameRequest && !onToggleSharePlan && !onDuplicatePlan && !onExportPlan && !onDeletePlan && !onUpdateModel)
    return null;

  const handleRename = () => {
    setMenuOpen(false);
    onRenameRequest?.();
  };

  const handleToggleShare = () => {
    setMenuOpen(false);
    onToggleSharePlan?.(planId);
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    onDuplicatePlan?.(planId);
  };

  const handleExport = () => {
    setMenuOpen(false);
    onExportPlan?.();
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (onDeletePlan) setConfirmingDelete(true);
  };

  const handleUpdateModel = () => {
    if (isOnLatestModel) return;
    setMenuOpen(false);
    onUpdateModel?.();
  };

  const confirmDelete = () => {
    setConfirmingDelete(false);
    onDeletePlan?.(planId);
  };

  return (
    <div className={styles.moreWrap} ref={menuRef}>
      {variant === "chevron" ? (
        <button
          type="button"
          className={title ? styles.chevronBtnWithTitle : styles.chevronBtn}
          aria-label={title ? undefined : "Plan options"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {title && <span className={styles.chevronBtnTitleText}>{title}</span>}
          <ChevronDownIcon size={18} />
        </button>
      ) : (
        <button type="button" className={styles.moreBtn} onClick={() => setMenuOpen((v) => !v)}>
          More
          <ChevronDownIcon size={18} />
        </button>
      )}
      {menuOpen && (
        <div className={styles.moreMenu}>
          {onRenameRequest && (
            <button type="button" onClick={handleRename}>
              <EditIcon size={20} /> Rename
            </button>
          )}
          {onToggleSharePlan && (
            <button type="button" onClick={handleToggleShare}>
              <MaterialIcon name={shared ? "group_off" : "group"} size={20} /> {shared ? "Unshare" : "Share"}
            </button>
          )}
          {onDuplicatePlan && (
            <button type="button" onClick={handleDuplicate}>
              <DuplicateIcon size={20} /> Duplicate
            </button>
          )}
          {onExportPlan && (
            <button type="button" onClick={handleExport}>
              <DownloadIcon size={20} /> Export
            </button>
          )}
          {onDeletePlan && (
            <button type="button" className={styles.dangerItem} onClick={handleDelete}>
              <TrashIcon size={20} /> Delete
            </button>
          )}
          {onUpdateModel && (
            <>
              <div className={styles.menuDivider} />
              <button
                type="button"
                className={`${styles.stackedItem} ${isOnLatestModel ? styles.stackedItemDisabled : ""}`}
                aria-disabled={isOnLatestModel}
                onClick={handleUpdateModel}
              >
                <MaterialIcon name="autorenew" size={20} />
                <span className={styles.stackedItemText}>
                  <span className={styles.stackedItemLabel}>Update model</span>
                  {currentModelLabel && <span className={styles.stackedItemSub}>{currentModelLabel}</span>}
                </span>
                {isOnLatestModel && (
                  <span className={styles.stackedItemTooltip} role="tooltip">
                    You're already using the latest model data for this plan.
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      )}
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete plan?"
        message={`Delete "${planLabel}"? This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
