import { useLayoutEffect, useRef, useState } from "react";
import { EditIcon } from "./icons/BuildPlanIcons";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./PlanInfoBar.module.css";

type Props = {
  periodLabel: string;
  conversionType: string;
  channelsLabel: string;
  budgetSourceLabel: string;
  tacticsIncluded: number;
  onEditPlan?: () => void;
  /** "settings" (default): the plain "Plan settings" link, opening the full-page edit modal.
   * "mia": an "Edit" link with the Mia sparkle icon, opening the Mia panel's edit-plan flow
   * instead -- used for plans that support editing conversationally. */
  editVariant?: "settings" | "mia";
};

export function PlanInfoBar({
  periodLabel,
  conversionType,
  channelsLabel,
  budgetSourceLabel,
  tacticsIncluded,
  onEditPlan,
  editVariant = "settings",
}: Props) {
  const isMiaEdit = editVariant === "mia";
  const editLabel = isMiaEdit ? "Edit" : "Plan settings";
  const EditGlyph = isMiaEdit ? SparkleIcon : EditIcon;
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  // Collapses the "Plan settings" label to icon-only once the items no longer fit at full
  // width; item values then fall back to their own text-overflow ellipsis (see CSS) if that
  // alone isn't enough — e.g. a very long conversion type name or budget file name.
  const [compact, setCompact] = useState(false);

  const items = [
    { key: "period", label: "Planning period", value: periodLabel },
    { key: "conversion", label: "Conversion type", value: conversionType },
    { key: "channels", label: "Channels", value: channelsLabel },
    { key: "tactics", label: "Tactics", value: `${tacticsIncluded} tactics` },
    { key: "budget", label: "Budget from", value: budgetSourceLabel },
  ];

  useLayoutEffect(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    // contentRect/contentBoxSize excludes the bar's own padding, unlike clientWidth — using
    // clientWidth here would overstate the space actually available to the items/actions
    // children by the padding amount, delaying compact/truncate past when they're really needed.
    function recalc(availableWidth: number) {
      if (!measure) return;
      setCompact(measure.scrollWidth > availableWidth);
    }

    const style = getComputedStyle(container);
    const horizontalPadding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    recalc(container.getBoundingClientRect().width - horizontalPadding);
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentBoxSize?.[0];
      const width = box ? box.inlineSize : entries[0].contentRect.width;
      recalc(width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [periodLabel, conversionType, channelsLabel, tacticsIncluded, budgetSourceLabel]);

  return (
    <div className={styles.bar} ref={containerRef}>
      {/* Hidden, unwrapped clone with the "Plan settings" label always shown — used only to
       * measure the content's natural full-text width against the bar's real available width. */}
      <div className={styles.measurer} ref={measureRef} aria-hidden>
        <div className={styles.items}>
          {items.map((item) => (
            <div className={styles.item} key={item.key}>
              <span className={styles.itemLabel}>{item.label}</span>
              <span className={styles.itemValue}>{item.value}</span>
            </div>
          ))}
        </div>
        <div className={styles.actions}>
          <span className={styles.editLink}>
            <EditGlyph size={18} />
            <span>{editLabel}</span>
          </span>
        </div>
      </div>

      <div className={styles.items}>
        {items.map((item) => (
          <div className={styles.item} key={item.key}>
            <span className={styles.itemLabel}>{item.label}</span>
            <span className={styles.itemValue}>{item.value}</span>
          </div>
        ))}
      </div>
      <div className={styles.actions}>
        {onEditPlan && (
          <button type="button" className={styles.editLink} onClick={onEditPlan}>
            <EditGlyph size={18} />
            {!compact && editLabel}
          </button>
        )}
      </div>
    </div>
  );
}
