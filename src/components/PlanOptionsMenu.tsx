import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { DuplicateIcon, EditIcon, MoreIcon, TrashIcon } from "./icons/BuildPlanIcons";
import styles from "./PlanOptionsMenu.module.css";

type Props = {
  planId: string;
  planLabel: string;
  onRenamePlan?: (id: string, label: string) => void;
  onDuplicatePlan?: (id: string) => void;
  onDeletePlan?: (id: string) => void;
};

export function PlanOptionsMenu({ planId, planLabel, onRenamePlan, onDuplicatePlan, onDeletePlan }: Props) {
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

  if (!onRenamePlan && !onDuplicatePlan && !onDeletePlan) return null;

  const handleRename = () => {
    setMenuOpen(false);
    if (!onRenamePlan) return;
    const next = window.prompt("Rename plan", planLabel);
    if (next && next.trim()) onRenamePlan(planId, next.trim());
  };

  const handleDuplicate = () => {
    setMenuOpen(false);
    onDuplicatePlan?.(planId);
  };

  const handleDelete = () => {
    setMenuOpen(false);
    if (onDeletePlan) setConfirmingDelete(true);
  };

  const confirmDelete = () => {
    setConfirmingDelete(false);
    onDeletePlan?.(planId);
  };

  return (
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
