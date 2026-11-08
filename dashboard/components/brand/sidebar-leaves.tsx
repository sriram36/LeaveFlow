import { cn } from "@/lib/utils";

/**
 * Decorative leaf cluster for the bottom of the sidebar (drawn here, in the brand colour,
 * so it follows the theme). Purely ornamental, hidden from assistive technology.
 */

// One leaf, base at the origin, tip about 64 units to the right.
const LEAF = "M0 0 C 14 -24 46 -28 66 -10 C 48 12 16 16 0 0 Z";
const VEIN = "M2 0 C 20 -4 40 -7 60 -10";

const LEAVES: { x: number; y: number; rotate: number; scale: number; opacity: number }[] = [
  { x: 56, y: 150, rotate: -112, scale: 1.25, opacity: 0.34 },
  { x: 56, y: 150, rotate: -62, scale: 1.1, opacity: 0.22 },
  { x: 56, y: 150, rotate: -158, scale: 1.0, opacity: 0.2 },
  { x: 70, y: 112, rotate: -28, scale: 1.0, opacity: 0.4 },
  { x: 70, y: 112, rotate: -150, scale: 0.95, opacity: 0.28 },
  { x: 82, y: 76, rotate: -78, scale: 0.9, opacity: 0.46 },
  { x: 82, y: 76, rotate: -6, scale: 0.7, opacity: 0.3 },
  { x: 82, y: 76, rotate: -170, scale: 0.7, opacity: 0.24 },
  { x: 150, y: 150, rotate: -120, scale: 0.8, opacity: 0.2 },
  { x: 150, y: 150, rotate: -70, scale: 0.65, opacity: 0.26 },
];

export function SidebarLeaves({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 160"
      aria-hidden
      focusable="false"
      className={cn("pointer-events-none select-none text-primary", className)}
    >
      <path
        d="M56 160 C 60 136, 68 124, 70 112 S 84 92, 82 76"
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.45}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path d="M150 160 C 150 152, 150 150, 150 150" stroke="currentColor" strokeOpacity={0.3} strokeWidth={2} strokeLinecap="round" />
      {LEAVES.map((leaf, i) => (
        <g key={i} transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rotate}) scale(${leaf.scale})`}>
          <path d={LEAF} fill="currentColor" fillOpacity={leaf.opacity} />
          <path d={VEIN} fill="none" stroke="currentColor" strokeOpacity={leaf.opacity + 0.15} strokeWidth={1.2} strokeLinecap="round" />
        </g>
      ))}
    </svg>
  );
}
