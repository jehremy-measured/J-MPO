import { useEffect, useRef, useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import { ChevronDownIcon, DuplicateIcon, EditIcon, TrashIcon } from "./icons/BuildPlanIcons";
import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./PlanOptionsMenu.module.css";

type Props = {
  planId: string;
  planLabel: string;
  shared?: boolean;
  onRenameRequest?: () => void;
  onToggleSharePlan?: (id: string) => void;
  onDuplicatePlan?: (id: string) => void;
  onDeletePlan?: (id: string) => void;
};

export function PlanOptionsMenu({
  planId,
  planLabel,
  shared,
  onRenameRequest,
  onToggleSharePlan,
  onDuplicatePlan,
  onDeletePlan,
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

  if (!onRenameRequest && !onToggleSharePlan && !onDuplicatePlan && !onDeletePlan) return null;

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
      <button type="button" className={styles.moreBtn} onClick={() => setMenuOpen((v) => !v)}>
        More
        <ChevronDownIcon size={18} />
      </button>
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
