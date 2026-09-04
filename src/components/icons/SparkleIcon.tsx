import { MaterialIcon } from "./MaterialIcon";

export function SparkleIcon({ size = 16, variant }: { size?: number; variant?: "line" | "fill" }) {
  return <MaterialIcon name="auto_awesome" size={size} variant={variant} />;
}
