import { useEffect, useRef, useState } from "react";
import type { PlanTarget } from "../mpo/types";
import { formatTargetLabel } from "../mpo/buildPlan/logic";
import { ConfirmDialog } from "./ConfirmDialog";
import { DuplicateIcon, EditIcon, MoreIcon, TrashIcon } from "./icons/BuildPlanIcons";
import styles from "./PlanInfoBar.module.css";

type Props = {
  periodLabel: string;
  target: PlanTarget;
  targetValue: number | null;
  conversionType: string;
  onEditPlan?: () => void;
  planId?: string;
  planLabel?: string;
  onRenamePlan?: (id: string, label: string) => void;
  onDuplicatePlan?: (id: string) => void;
  onDeletePlan?: (id: string) => void;
};

export function PlanInfoBar({
  periodLabel,
  target,
  targetValue,
  conversionType,
  onEditPlan,
  planId,
  planLabel,
  onRenamePlan,
  onDuplicatePlan,
  onDeletePlan,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const showMoreMenu = planId && (onRenamePlan || onDuplicatePlan || onDeletePlan);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const handleRename = () => {
    setMenuOpen(false);
    if (!planId || !onRenamePlan) return;
    const next = window.prompt("Rename plan", planLabel ?? "");
    if (next && next.trim()) onRenamePlan(planId, next.trim());
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    if (planId && onDuplicatePlan) onDuplicatePlan(planId);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (!planId || !onDeletePlan) return;
    setConfirmingDelete(true);
  };

  const confirmDelete = () => {
    setConfirmingDelete(false);
    if (planId && onDeletePlan) onDeletePlan(planId);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.items}>
        <span className={styles.item}>
          Planning for <strong>{periodLabel}</strong>
        </span>
        <span className={styles.divider} aria-hidden />
        <span className={styles.item}>
          Target <strong>{formatTargetLabel(target, targetValue)}</strong>
        </span>
        <span className={styles.divider} aria-hidden />
        <span className={styles.item}>
          Conversion type <strong>{conversionType}</strong>
        </span>
      </div>
      <div className={styles.actions}>
        {onEditPlan && (
          <button type="button" className={styles.editLink} onClick={onEditPlan}>
            <EditIcon size={18} />
            Edit plan
          </button>
        )}
        {showMoreMenu && (
          <>
            <span className={styles.divider} aria-hidden />
            <div className={styles.moreWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="More plan options"
                onClick={() => setMenuOpen((v) => !v)}
              >
                <MoreIcon size={20} />
              </button>
              {menuOpen && (
                <div className={styles.moreMenu}>
                  {onRenamePlan && (
                    <button type="button" onClick={handleRename}>
                      <EditIcon size={20} /> Rename
                    </button>
                  )}
                  {onDuplicatePlan && (
                    <button type="button" onClick={handleDuplicate}>
                      <DuplicateIcon size={20} /> Duplicate
                    </button>
                  )}
                  {onDeletePlan && (
                    <button type="button" className={styles.dangerItem} onClick={handleDelete}>
                      <TrashIcon size={20} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete plan?"
        message={`Delete "${planLabel ?? "this plan"}"? This can't be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
