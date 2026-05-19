/**
 * Lightweight SVG line motif for the hero (no bitmaps — better LCP and crisp scaling).
 */
export function HeroPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-surface-mid"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.35" />
      <circle cx="85%" cy="15%" r="120" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.45" />
      <circle cx="10%" cy="80%" r="90" fill="none" stroke="currentColor" strokeWidth="0.75" opacity="0.35" />
    </svg>
  );
}
