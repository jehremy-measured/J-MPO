import { useEffect, useRef, useState } from "react";
import type { Plan } from "../mpo/types";
import styles from "./PlanTabs.module.css";

type Props = {
  plans: Plan[];
  activePlanId: string;
  onSelectPlan: (id: string) => void;
};

export function PlanTabs({ plans, activePlanId, onSelectPlan }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [plans]);

  const scrollByAmount = (direction: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.round(el.clientWidth * 0.6), behavior: "smooth" });
  };

  return (
    <div className={styles.wrap} data-node-id="1:33656">
      <div className={styles.tabsViewport}>
        <div className={styles.tabs} ref={scrollRef} onScroll={updateScrollState}>
          {plans.map((plan, index) => {
            const active = plan.id === activePlanId;
            return (
              <div key={plan.id} className={styles.tabGroup}>
                {index === 1 && <span className={styles.tabDivider} aria-hidden />}
                <button
                  type="button"
                  className={active ? `${styles.tab} ${styles.tabActive}` : styles.tab}
                  onClick={() => onSelectPlan(plan.id)}
                >
                  {plan.label}
                  {active && <span className={styles.underline} />}
                </button>
              </div>
            );
          })}
        </div>
        {canScrollLeft && (
          <button
            type="button"
            className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`}
            aria-label="Scroll plans left"
            onClick={() => scrollByAmount(-1)}
          >
            ‹
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            className={`${styles.scrollBtn} ${styles.scrollBtnRight}`}
            aria-label="Scroll plans right"
            onClick={() => scrollByAmount(1)}
          >
            ›
          </button>
        )}
      </div>
      <span className={styles.actionsDivider} aria-hidden />
      <button type="button" className={styles.iconAction} aria-label="Compare">
        ⧉
      </button>
      <button type="button" className={styles.iconAction} aria-label="Menu">
        ☰
      </button>
    </div>
  );
}
