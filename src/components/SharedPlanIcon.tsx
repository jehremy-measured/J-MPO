import { MaterialIcon } from "./icons/MaterialIcon";
import styles from "./SharedPlanIcon.module.css";

const CURRENT_USER_INITIALS = "JH";

type Props = {
  createdBy: string;
};

/** The "shared" people icon shown next to a plan's name in the plans list — reused wherever a
 * plan's shared state needs the same glyph plus its hover tooltip explaining who shared it. */
export function SharedPlanIcon({ createdBy }: Props) {
  return (
    <span className={styles.sharedIconWrap}>
      <span className={styles.sharedIcon} aria-label="Shared plan">
        <MaterialIcon name="group" size={20} />
      </span>
      <span className={styles.sharedTooltip} role="tooltip">
        {createdBy === CURRENT_USER_INITIALS
          ? "You have shared this plan with others on your team."
          : "This plan has been shared with you."}
      </span>
    </span>
  );
}
