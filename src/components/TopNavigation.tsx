import { type ReactNode, useEffect, useRef, useState } from "react";
import logoMark from "../assets/brand/measured-logo-mark.svg";
import { ChevronDownIcon, UpDownChevronIcon, WrenchIcon } from "./icons/BuildPlanIcons";
import { MaterialIcon } from "./icons/MaterialIcon";
import { SparkleIcon } from "./icons/SparkleIcon";
import styles from "./TopNavigation.module.css";

const navItems = [
  { label: "Analyze", active: false },
  { label: "Experiment", active: false },
  { label: "Optimize", active: true },
  { label: "Benchmarks", active: false },
  { label: "MIM", active: false },
];

type Props = {
  miaOpen: boolean;
  onMiaToggle: () => void;
};

export function TopNavigation({ miaOpen, onMiaToggle }: Props) {
  const [tabMenuOpen, setTabMenuOpen] = useState(false);
  const tabMenuRef = useRef<HTMLDivElement>(null);
  const activeItem = navItems.find((item) => item.active) ?? navItems[0];

  useEffect(() => {
    if (!tabMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(e.target as Node)) setTabMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setTabMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [tabMenuOpen]);

  return (
    <header className={styles.bar} data-node-id="1:33652">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src={logoMark} alt="Measured" className={styles.logo} />
          <button type="button" className={styles.workspace}>
            <span className={styles.workspaceLabel}>Lulus</span>
            <UpDownChevronIcon size={20} />
          </button>
        </div>

        <div className={styles.navCenter}>
          <nav className={styles.navFull} aria-label="Primary">
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
              </a>
            ))}
            <span className={styles.menuMore}>
              More
              <ChevronDownIcon size={15} />
            </span>
          </nav>

          <div className={styles.tabSwitcher} ref={tabMenuRef}>
            <button
              type="button"
              className={styles.tabSwitcherBtn}
              onClick={() => setTabMenuOpen((v) => !v)}
              aria-expanded={tabMenuOpen}
              aria-haspopup="menu"
            >
              <span className={styles.tabSwitcherLabel}>{activeItem.label}</span>
              <ChevronDownIcon size={20} />
            </button>
            {tabMenuOpen && (
              <div className={styles.tabMenu} role="menu">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href="#"
                    role="menuitem"
                    className={item.active ? styles.tabMenuItemActive : undefined}
                    onClick={() => setTabMenuOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightGroup}>
          <IconButton label="Notifications" dot>
            <MaterialIcon name="notifications" size={20} />
          </IconButton>
          <IconButton label="Tools">
            <WrenchIcon size={20} />
          </IconButton>
          <IconButton label="Help">
            <MaterialIcon name="help" size={20} />
          </IconButton>

          <div className={styles.avatar} aria-label="User JH">
            JH
          </div>

          <button
            type="button"
            className={miaOpen ? `${styles.miaBtn} ${styles.miaBtnActive}` : styles.miaBtn}
            onClick={onMiaToggle}
            aria-expanded={miaOpen}
            aria-controls="mia-side-panel"
          >
            <SparkleIcon size={20} variant="fill" />
            Ask Mia
          </button>
        </div>
      </div>
    </header>
  );
}

function IconButton({
  children,
  label,
  dot,
}: {
  children: ReactNode;
  label: string;
  dot?: boolean;
}) {
  return (
    <button type="button" className={styles.iconBtn} aria-label={label}>
      {children}
      {dot && <span className={styles.dot} />}
    </button>
  );
}
