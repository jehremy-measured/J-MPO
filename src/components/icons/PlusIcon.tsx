import { MaterialIcon } from "./MaterialIcon";

export function PlusIcon({ size = 18, variant }: { size?: number; variant?: "line" | "fill" }) {
  return <MaterialIcon name="add" size={size} variant={variant} />;
}
