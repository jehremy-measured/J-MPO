import { useEffect, useRef, useState } from "react";
import logoMark from "../assets/brand/measured-logo-mark.svg";
import { ChevronDownIcon, MoreIcon } from "./icons/BuildPlanIcons";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./TopNavigation.module.css";

const navItems = [
  { label: "Home", active: false },
  { label: "Experiment", active: false },
  { label: "Optimize", active: true, badge: true },
  { label: "Benchmarks", active: false },
];

type Props = {
  miaOpen: boolean;
  onMiaToggle: () => void;
};

export function TopNavigation({ miaOpen, onMiaToggle }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const [navFade, setNavFade] = useState<{ left: boolean; right: boolean }>({ left: false, right: false });

  useEffect(() => {
    if (!moreOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [moreOpen]);

  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const update = () => {
      setNavFade({
        left: el.scrollLeft > 2,
        right: el.scrollLeft + el.clientWidth < el.scrollWidth - 2,
      });
    };
    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const navMaskImage =
    navFade.left && navFade.right
      ? "linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)"
      : navFade.right
        ? "linear-gradient(to right, black calc(100% - 20px), transparent 100%)"
        : navFade.left
          ? "linear-gradient(to left, black calc(100% - 20px), transparent 100%)"
          : undefined;

  return (
    <header className={styles.bar} data-node-id="1:33652">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src={logoMark} alt="Measured" className={styles.logo} />
          <span className={styles.divider} aria-hidden />
          <button type="button" className={styles.workspace}>
            <span className={styles.workspaceLabel}>Measured Demo</span>
            <ChevronDownIcon size={16} />
          </button>
        </div>

        <nav
          className={styles.menu}
          aria-label="Primary"
          ref={navRef}
          style={
            navMaskImage
              ? { WebkitMaskImage: navMaskImage, maskImage: navMaskImage }
              : undefined
          }
        >

          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={
                item.active
                  ? `${styles.menuItem} ${styles.menuItemActive}`
                  : styles.menuItem
              }
            >
              {item.label}
              {item.badge && <span className={styles.newBadge}>NEW</span>}
            </a>
          ))}
        </nav>

        <div className={styles.rightGroup}>
          <button
            type="button"
            className={miaOpen ? `${styles.miaBtn} ${styles.miaBtnActive}` : styles.miaBtn}
            onClick={onMiaToggle}
            aria-expanded={miaOpen}
            aria-controls="mia-side-panel"
          >
            <SparkleIcon size={14} />
            Mia
          </button>

          <div className={styles.moreWrap} ref={moreRef}>
            <button
              type="button"
              className={moreOpen ? `${styles.moreBtn} ${styles.moreBtnActive}` : styles.moreBtn}
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              <MoreIcon size={16} />
              More
              <span className={styles.dot} aria-hidden />
            </button>
            {moreOpen && (
              <div className={styles.moreMenu} role="menu">
                <div className={styles.moreMenuNav}>
                  {navItems.map((item) => (
                    <a
                      key={item.label}
                      href="#"
                      role="menuitem"
                      className={item.active ? styles.moreMenuNavItemActive : undefined}
                      onClick={() => setMoreOpen(false)}
                    >
                      {item.label}
                      {item.badge && <span className={styles.newBadge}>NEW</span>}
                    </a>
                  ))}
                </div>
                <button type="button" role="menuitem" onClick={() => setMoreOpen(false)}>
                  🔔 Notifications
                </button>
                <button type="button" role="menuitem" onClick={() => setMoreOpen(false)}>
                  ⚙ Settings
                </button>
                <button type="button" role="menuitem" onClick={() => setMoreOpen(false)}>
                  ☀ Theme
                </button>
              </div>
            )}
          </div>

          <div className={styles.avatar} aria-label="User AR">
            AR
          </div>
        </div>
      </div>
    </header>
  );
}
