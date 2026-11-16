import styles from "./Switch.module.css";

type Props = {
  checked: boolean;
  onChange: () => void;
  ariaLabel?: string;
};

/** The pill toggle switch used for on/off settings across the app. */
export function Switch({ checked, onChange, ariaLabel }: Props) {
  return (
    <span className={styles.switch} data-on={checked}>
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
      />
      <span className={styles.track}>
        <span className={styles.thumb} />
      </span>
    </span>
  );
}
