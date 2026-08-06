export function EditIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M9.5 2.5l4 4L5.5 14.5H1.5v-4l8-8Z"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinejoin="round"
      />
      <path d="M8 4l4 4" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}
