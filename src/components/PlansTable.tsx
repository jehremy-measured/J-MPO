import { useEffect, useRef, useState } from "react";
import { formatShortDate } from "../mpo/buildPlan/dateUtils";
import type { Plan, PlanTarget } from "../mpo/types";
import { Checkbox } from "./Checkbox";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  ChevronDownIcon,
  DownloadIcon,
  DuplicateIcon,
  EditIcon,
  MoreIcon,
  ReturnCurveIcon,
  SearchIcon,
  TrashIcon,
  WrenchIcon,
} from "./icons/BuildPlanIcons";
import { MaterialIcon } from "./icons/MaterialIcon";
import { SharedPlanIcon } from "./SharedPlanIcon";
import styles from "./PlansTable.module.css";

type Props = {
  plans: Plan[];
  onOpenPlan: (id: string) => void;
  onDuplicatePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onRenamePlan: (id: string, label: string) => void;
  onToggleSharePlan: (id: string) => void;
};

type DateFilter = "90d" | "all";

const DATE_FILTER_LABEL: Record<DateFilter, string> = {
  "90d": "Last 90 days",
  all: "All time",
};

const KIND_LABEL: Record<Plan["kind"], string> = {
  optimization: "Optimization",
  simulation: "Simulation",
};

const TARGET_LABEL: Record<PlanTarget, string> = {
  "incremental-sales": "Incremental Sales",
  "incremental-orders": "Incremental Orders",
  "incremental-roas": "Incremental ROAS",
  "incremental-cpo": "Incremental CPO",
};

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function downloadPlansCsv(plansToExport: Plan[]) {
  const header = ["Plan name", "Type", "Created by", "Last updated", "Target"];
  const rows = plansToExport.map((plan) => [
    plan.label,
    KIND_LABEL[plan.kind],
    plan.createdBy,
    formatShortDate(plan.lastEdited),
    TARGET_LABEL[plan.target],
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = plansToExport.length === 1 ? `${plansToExport[0].label}.csv` : "plans.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}

function KindIcon({ kind }: { kind: Plan["kind"] }) {
  return (
    <span className={`${styles.kindIcon} ${kind === "optimization" ? styles.kindOptimization : styles.kindSimulation}`}>
      {kind === "optimization" ? <WrenchIcon size={13} /> : <ReturnCurveIcon size={13} />}
    </span>
  );
}

export function PlansTable({
  plans,
  onOpenPlan,
  onDuplicatePlan,
  onDeletePlan,
  onRenamePlan,
  onToggleSharePlan,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [footerMenuOpen, setFooterMenuOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ ids: string[]; message: string } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const footerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filterOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filterOpen]);

  useEffect(() => {
    if (!openMenuId) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMenuId]);

  useEffect(() => {
    if (!footerMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(e.target as Node)) setFooterMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [footerMenuOpen]);

  const now = Date.now();
  const visiblePlans = plans.filter((plan) => {
    const matchesQuery = plan.label.toLowerCase().includes(query.trim().toLowerCase());
    const matchesDate = dateFilter === "all" || now - plan.lastEdited.getTime() <= NINETY_DAYS_MS;
    return matchesQuery && matchesDate;
  });

  const allSelected = visiblePlans.length > 0 && visiblePlans.every((p) => selected.has(p.id));
  const someSelected = !allSelected && visiblePlans.some((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        visiblePlans.forEach((p) => next.delete(p.id));
        return next;
      }
      return new Set([...prev, ...visiblePlans.map((p) => p.id)]);
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    if (renamingId) renameInputRef.current?.select();
  }, [renamingId]);

  const startRename = (plan: Plan) => {
    setOpenMenuId(null);
    setRenamingId(plan.id);
    setRenameValue(plan.label);
  };

  const commitRename = () => {
    if (renamingId) onRenamePlan(renamingId, renameValue);
    setRenamingId(null);
  };

  const requestDelete = (ids: string[], message: string) => {
    setOpenMenuId(null);
    setFooterMenuOpen(false);
    setPendingDelete({ ids, message });
  };

  const handleDelete = (plan: Plan) => {
    requestDelete([plan.id], `Delete "${plan.label}"? This can't be undone.`);
  };

  const handleDeleteSelected = () => {
    requestDelete(
      [...selected],
      `Delete ${selected.size} plan${selected.size === 1 ? "" : "s"}? This can't be undone.`
    );
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    pendingDelete.ids.forEach((id) => onDeletePlan(id));
    setSelected((prev) => {
      const next = new Set(prev);
      pendingDelete.ids.forEach((id) => next.delete(id));
      return next;
    });
    setPendingDelete(null);
  };

  const selectedPlans = plans.filter((p) => selected.has(p.id));

  const handleShareSelected = () => {
    setFooterMenuOpen(false);
    selectedPlans.forEach((plan) => {
      if (!plan.shared) onToggleSharePlan(plan.id);
    });
  };

  const handleDownloadSelected = () => {
    setFooterMenuOpen(false);
    downloadPlansCsv(selectedPlans);
  };

  return (
    <section className={selected.size > 0 ? `${styles.section} ${styles.sectionWithFooter}` : styles.section}>
      <div className={styles.header}>
        <h2>Plans</h2>
        {selected.size > 0 && <span className={styles.selectedCount}>{selected.size} selected</span>}
        <div className={styles.headerControls}>
          <div className={styles.search}>
            <SearchIcon size={20} />
            <input
              type="search"
              placeholder="Search plans"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterDropdown} ref={filterRef}>
            <button type="button" className={styles.filterBtn} onClick={() => setFilterOpen((v) => !v)}>
              {DATE_FILTER_LABEL[dateFilter]}
              <ChevronDownIcon size={20} />
            </button>
            {filterOpen && (
              <div className={styles.filterPanel}>
                {(Object.keys(DATE_FILTER_LABEL) as DateFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={key === dateFilter ? styles.filterOptionActive : styles.filterOption}
                    onClick={() => {
                      setDateFilter(key);
                      setFilterOpen(false);
                    }}
                  >
                    {DATE_FILTER_LABEL[key]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <ReturnCurveIcon size={22} />
          </span>
          <p className={styles.emptyTitle}>No plans yet</p>
          <p className={styles.emptyDesc}>Click Simulate or Optimize above to create your first plan.</p>
        </div>
      ) : (
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCol}>
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleAll}
                  ariaLabel="Select all plans"
                />
              </th>
              <th>Plan name</th>
              <th>Type</th>
              <th>Created by</th>
              <th>Last updated</th>
              <th className={styles.menuCol} />
            </tr>
          </thead>
          <tbody>
            {visiblePlans.map((plan) => (
              <tr key={plan.id} className={styles.row} onClick={() => onOpenPlan(plan.id)}>
                <td className={styles.checkboxCol} onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(plan.id)}
                    onChange={() => toggleOne(plan.id)}
                    ariaLabel={`Select ${plan.label}`}
                  />
                </td>
                <td className={styles.nameCol}>
                  {renamingId === plan.id ? (
                    <span className={styles.nameCellLeft} onClick={(e) => e.stopPropagation()}>
                      <KindIcon kind={plan.kind} />
                      <input
                        ref={renameInputRef}
                        type="text"
                        className={styles.renameInput}
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                      />
                    </span>
                  ) : (
                    <span className={styles.nameCell}>
                      <span className={styles.nameCellLeft}>
                        <KindIcon kind={plan.kind} />
                        <span className={styles.nameText}>{plan.label}</span>
                      </span>
                      {plan.shared && <SharedPlanIcon createdBy={plan.createdBy} />}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`${styles.badge} ${plan.kind === "optimization" ? styles.badgeOptimization : styles.badgeSimulation}`}>
                    {KIND_LABEL[plan.kind]}
                  </span>
                </td>
                <td>{plan.createdBy}</td>
                <td>{formatShortDate(plan.lastEdited)}</td>
                <td className={styles.menuCol} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.moreWrap} ref={plan.id === openMenuId ? menuRef : undefined}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      aria-label={`More options for ${plan.label}`}
                      onClick={() => setOpenMenuId(openMenuId === plan.id ? null : plan.id)}
                    >
                      <MoreIcon size={20} />
                    </button>
                    {openMenuId === plan.id && (
                      <div className={styles.moreMenu}>
                        <button type="button" onClick={() => startRename(plan)}>
                          <EditIcon size={20} /> Rename
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onToggleSharePlan(plan.id);
                          }}
                        >
                          <MaterialIcon name={plan.shared ? "group_off" : "group"} size={20} /> {plan.shared ? "Unshare" : "Share"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            onDuplicatePlan(plan.id);
                          }}
                        >
                          <DuplicateIcon size={20} /> Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOpenMenuId(null);
                            downloadPlansCsv([plan]);
                          }}
                        >
                          <DownloadIcon size={20} /> Export
                        </button>
                        <button type="button" className={styles.dangerItem} onClick={() => handleDelete(plan)}>
                          <TrashIcon size={20} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {visiblePlans.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyRow}>
                  No plans match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {selected.size > 0 && (
        <div className={styles.bulkFooter}>
          <span className={styles.bulkCount}>{selected.size} selected</span>
          <div className={styles.bulkActions}>
            <button type="button" className={styles.bulkBtn} onClick={handleShareSelected}>
              Share
            </button>
            <button type="button" className={styles.bulkBtn} onClick={handleDownloadSelected}>
              Export
            </button>
            <div className={styles.moreWrap} ref={footerMenuRef}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="More bulk actions"
                onClick={() => setFooterMenuOpen((v) => !v)}
              >
                <MoreIcon size={20} />
              </button>
              {footerMenuOpen && (
                <div className={`${styles.moreMenu} ${styles.moreMenuUp}`}>
                  <button type="button" className={styles.dangerItem} onClick={handleDeleteSelected}>
                    <TrashIcon size={20} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete && pendingDelete.ids.length > 1 ? "Delete plans?" : "Delete plan?"}
        message={pendingDelete?.message ?? ""}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
