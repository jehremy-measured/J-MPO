export function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 0l1.2 4.4L13.6 6 9.2 7.2 8 11.6 6.8 7.2 2.4 6 6.8 4.4 8 0z" />
      <path
        d="M13 9l.6 2.2 2.2.6-2.2.6-.6 2.2-.6-2.2-2.2-.6 2.2-.6.6-2.2z"
        opacity="0.85"
      />
      <path d="M3 8l.5 1.8L5.3 10l-1.8.5-.5 1.8-.5-1.8L1.7 10l1.8-.5.5-1.8z" opacity="0.7" />
    </svg>
  );
}
