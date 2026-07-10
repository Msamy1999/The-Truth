/**
 * Inline-SVG rendering of public/logo-mark.svg (keep the two in sync).
 *
 * Three wandering paths converging into one straight path, ending at a gold
 * destination point. Strokes use currentColor so the mark follows the text
 * colour of its parent (e.g. `text-accent`) in light and dark mode; size it
 * with Tailwind classes such as `h-8 w-8`.
 */
type LogoMarkProps = {
  className?: string;
  /** Accessible name. When omitted the mark is decorative (aria-hidden). */
  title?: string;
};

export function LogoMark({ className, title }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {/* Three wandering paths converging into one straight path */}
      <path
        d="M6 13 C 16 13, 21 30, 29.5 31.7"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M6 32 C 12 27.5, 17 36.5, 29.5 32"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.65"
      />
      <path
        d="M6 51 C 16 51, 21 34, 29.5 32.3"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* The one straight path */}
      <path d="M30 32 L51 32" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      {/* Destination point */}
      <circle cx="57.5" cy="32" r="3.4" fill="#C8951E" />
    </svg>
  );
}
