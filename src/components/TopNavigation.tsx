import type { ReactNode } from "react";
import { assets } from "../assets/figma";
import styles from "./TopNavigation.module.css";

const navItems = [
  { label: "Home", active: false },
  { label: "Experiment", active: false },
  { label: "Optimize", active: true, badge: true },
  { label: "Benchmarks", active: false },
];

export function TopNavigation() {
  return (
    <header className={styles.bar} data-node-id="1:33652">
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src={assets.logo} alt="Measured" className={styles.logo} />
          <span className={styles.divider} aria-hidden />
          <button type="button" className={styles.workspace}>
            Measured Demo
            <ChevronDown />
          </button>
        </div>

        <nav className={styles.menu} aria-label="Primary">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              className={
                item.active ? `${styles.menuItem} ${styles.menuItemActive}` : styles.menuItem
              }
            >
              {item.label}
              {item.badge && <span className={styles.newBadge}>NEW</span>}
            </a>
          ))}
        </nav>

        <div className={styles.utilities}>
          <IconButton label="Help">?</IconButton>
          <IconButton label="Notifications" dot>
            🔔
          </IconButton>
          <IconButton label="Settings">⚙</IconButton>
          <IconButton label="Theme">☀</IconButton>
          <div className={styles.avatar} aria-label="User AR">
            AR
          </div>
        </div>
      </div>
    </header>
  );
}

function ChevronDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path
        d="M5 8l5 5 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
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
