type Props = {
  name: string;
  size?: number;
  className?: string;
};

/** Renders a glyph from the Google Material Icons font, sized and colored like the
 * inline SVG icons it replaces (color follows currentColor, size sets both the
 * font-size and the box so layout math elsewhere in the app keeps working). */
export function MaterialIcon({ name, size = 20, className }: Props) {
  return (
    <span
      className={`material-icons${className ? ` ${className}` : ""}`}
      style={{
        fontSize: size,
        width: size,
        height: size,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden
    >
      {name}
    </span>
  );
}
