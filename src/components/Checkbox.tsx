import { CheckIcon } from "./icons/BuildPlanIcons";
import styles from "./Checkbox.module.css";

type Props = {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  ariaLabel?: string;
  size?: number;
};

/** The single checkbox look used everywhere in the app: a rounded square that fills
 * blue with a white checkmark when checked (or a dash when indeterminate). */
export function Checkbox({ checked, indeterminate = false, onChange, ariaLabel, size = 20 }: Props) {
  return (
    <span className={styles.inc} style={{ width: size, height: size }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={ariaLabel}
        ref={(el) => {
          if (el) el.indeterminate = indeterminate;
        }}
      />
      <span className={styles.incBox}>
        {checked ? (
          <CheckIcon size={Math.round(size * 0.6)} />
        ) : indeterminate ? (
          <span className={styles.incBoxDash} />
        ) : null}
      </span>
    </span>
  );
}
