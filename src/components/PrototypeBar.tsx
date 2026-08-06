import styles from "./PrototypeBar.module.css";

type Props = {
  message: string | null;
  onDismiss: () => void;
  totalBudget: number;
  totalSales: number;
  blendedRoas: number;
};

export function PrototypeBar({
  message,
  onDismiss,
  totalBudget,
  totalSales,
  blendedRoas,
}: Props) {
  if (!message) return null;

  return (
    <div className={styles.bar} role="status">
      <p>{message}</p>
      <span className={styles.meta}>
        Budget ${Math.round(totalBudget).toLocaleString()} · Sales $
        {Math.round(totalSales).toLocaleString()} · ROAS {blendedRoas.toFixed(2)}
      </span>
      <button type="button" className={styles.dismiss} onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  );
}
