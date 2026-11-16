import { MaterialIcon } from "./MaterialIcon";

export function SendIcon({ size = 18, variant }: { size?: number; variant?: "line" | "fill" }) {
  return <MaterialIcon name="send" size={size} variant={variant} />;
}
