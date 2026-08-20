import { MaterialIcon } from "./MaterialIcon";

type IconProps = { size?: number };

export function UploadIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="upload" size={size} />;
}

export function HistoryIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="history" size={size} />;
}

export function ExpandIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="open_in_full" size={size} />;
}

export function MenuIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="menu" size={size} />;
}

export function UpDownChevronIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="unfold_more" size={size} />;
}

export function WrenchIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="build" size={size} />;
}

export function ReturnCurveIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="trending_up" size={size} />;
}

export function FileIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="description" size={size} />;
}

export function DownloadIcon({ size = 20 }: IconProps) {
  return <MaterialIcon name="download" size={size} />;
}

export function PlayIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="play_arrow" size={size} />;
}

export function ResetIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="restart_alt" size={size} />;
}

export function EditIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="edit" size={size} />;
}

export function DuplicateIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="content_copy" size={size} />;
}

export function TrashIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="delete" size={size} />;
}

export function InfoIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="info" size={size} />;
}

export function CheckIcon({ size = 13 }: IconProps) {
  return <MaterialIcon name="check" size={size} />;
}

export function BackArrowIcon({ size = 14 }: IconProps) {
  return <MaterialIcon name="arrow_back" size={size} />;
}

export function SearchIcon({ size = 17 }: IconProps) {
  return <MaterialIcon name="search" size={size} />;
}

export function MoreIcon({ size = 18 }: IconProps) {
  return <MaterialIcon name="more_vert" size={size} />;
}

export function ChevronLeftIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="chevron_left" size={size} />;
}

export function ChevronRightIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="chevron_right" size={size} />;
}

export function ChevronDownIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="expand_more" size={size} />;
}

export function ThinkingSpinnerIcon({ size = 16 }: IconProps) {
  return <MaterialIcon name="autorenew" size={size} />;
}
