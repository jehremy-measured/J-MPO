import { MaterialIcon } from "./MaterialIcon";

type IconProps = { size?: number; variant?: "line" | "fill" };

export function UploadIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="upload" size={size} variant={variant} />;
}

export function HistoryIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="history" size={size} variant={variant} />;
}

export function ExpandIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="open_in_full" size={size} variant={variant} />;
}

export function MenuIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="menu" size={size} variant={variant} />;
}

export function UpDownChevronIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="unfold_more" size={size} variant={variant} />;
}

export function WrenchIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="build" size={size} variant={variant} />;
}

export function ReturnCurveIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="trending_up" size={size} variant={variant} />;
}

export function FileIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="description" size={size} variant={variant} />;
}

export function DownloadIcon({ size = 20, variant }: IconProps) {
  return <MaterialIcon name="download" size={size} variant={variant} />;
}

export function PlayIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="play_arrow" size={size} variant={variant} />;
}

export function ResetIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="restart_alt" size={size} variant={variant} />;
}

export function EditIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="edit" size={size} variant={variant} />;
}

export function DuplicateIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="content_copy" size={size} variant={variant} />;
}

export function TrashIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="delete" size={size} variant={variant} />;
}

export function InfoIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="info" size={size} variant={variant} />;
}

export function CheckIcon({ size = 13, variant }: IconProps) {
  return <MaterialIcon name="check" size={size} variant={variant} />;
}

export function BackArrowIcon({ size = 14, variant }: IconProps) {
  return <MaterialIcon name="arrow_back" size={size} variant={variant} />;
}

export function SearchIcon({ size = 17, variant }: IconProps) {
  return <MaterialIcon name="search" size={size} variant={variant} />;
}

export function MoreIcon({ size = 18, variant }: IconProps) {
  return <MaterialIcon name="more_vert" size={size} variant={variant} />;
}

export function ChevronLeftIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="chevron_left" size={size} variant={variant} />;
}

export function ChevronRightIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="chevron_right" size={size} variant={variant} />;
}

export function ChevronDownIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="expand_more" size={size} variant={variant} />;
}

export function ThinkingSpinnerIcon({ size = 16, variant }: IconProps) {
  return <MaterialIcon name="autorenew" size={size} variant={variant} />;
}
