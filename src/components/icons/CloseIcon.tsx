import { MaterialIcon } from "./MaterialIcon";

export function CloseIcon({ size = 16, variant }: { size?: number; variant?: "line" | "fill" }) {
  return <MaterialIcon name="close" size={size} variant={variant} />;
}
