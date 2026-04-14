import React, { useCallback, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RelatedNoteItem {
  path: string;
  score: number;
  reasons?: string[];
}

export interface NoteGraphDendrogramProps {
  rootTitle: string;
  rootPath: string;
  relatedNotes: RelatedNoteItem[];
  onNodeClick?: (path: string) => void;
  width?: number;
  height?: number;
  /** Override the root node's base accent colour. Accepts any CSS colour value or var(--a-*) token. */
  accentColor?: string;
}

// ---------------------------------------------------------------------------
// Accent palette — one colour per collection group (cycles)
// These are background/border values only; text always uses neutral tokens.
// ---------------------------------------------------------------------------

const ACCENT_PALETTE: string[] = [
  'var(--a-mint)',
  'var(--a-sky)',
  'var(--a-lilac)',
  'var(--a-peach)',
  'var(--a-lime)',
  'var(--a-aqua)',
  'var(--a-rose)',
  'var(--a-sun)',
];

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function toCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/** Cubic bezier link from (x0,y0) to (x1,y1) curving toward the centre. */
function linkPath(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cx: number,
  cy: number
): string {
  // Control points: pull 40% toward the centre
  const cpx0 = x0 + (cx - x0) * 0.4;
  const cpy0 = y0 + (cy - y0) * 0.4;
  const cpx1 = x1 + (cx - x1) * 0.4;
  const cpy1 = y1 + (cy - y1) * 0.4;
  return `M ${x0},${y0} C ${cpx0},${cpy0} ${cpx1},${cpy1} ${x1},${y1}`;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  sub?: string;
  score?: number;
  reasons?: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NoteGraphDendrogram({
  rootTitle,
  rootPath,
  relatedNotes,
  onNodeClick,
  width = 480,
  height = 400,
  accentColor,
}: NoteGraphDendrogramProps) {
  const accent = accentColor ?? 'var(--a-mint)';
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: '',
  });

  const cx = width / 2;
  const cy = height / 2;
  const rootR = 24;
  const branchR = 10;
  const leafR = 8;

  // Radii for layout rings
  const branchRing = Math.min(cx, cy) * 0.42;
  const leafRing = Math.min(cx, cy) * 0.82;

  // Group related notes by collection (first path segment)
  const groups = React.useMemo(() => {
    const map = new Map<string, RelatedNoteItem[]>();
    for (const note of relatedNotes) {
      const col = note.path.split('/')[0] ?? 'other';
      if (!map.has(col)) map.set(col, []);
      map.get(col)!.push(note);
    }
    return Array.from(map.entries()); // [collection, notes[]]
  }, [relatedNotes]);

  // Assign angles: divide 360° evenly across all leaf nodes; groups are
  // centred over their cluster.
  const totalLeaves = relatedNotes.length;

  // Build flat list of leaves in group order, tracking group boundaries
  type LeafNode = {
    note: RelatedNoteItem;
    angle: number; // degrees
    groupIdx: number;
  };
  type BranchNode = {
    collection: string;
    angle: number;
    groupIdx: number;
  };

  const leafNodes: LeafNode[] = [];
  const branchNodes: BranchNode[] = [];

  let leafCursor = 0;
  for (let gi = 0; gi < groups.length; gi++) {
    const [collection, notes] = groups[gi];
    const startAngle = totalLeaves > 0 ? (leafCursor / totalLeaves) * 360 : 0;
    const endAngle =
      totalLeaves > 0 ? ((leafCursor + notes.length) / totalLeaves) * 360 : 0;
    const midAngle = (startAngle + endAngle) / 2;

    branchNodes.push({ collection, angle: midAngle, groupIdx: gi });

    for (let li = 0; li < notes.length; li++) {
      const leafAngle =
        totalLeaves > 0 ? ((leafCursor + li + 0.5) / totalLeaves) * 360 : 0;
      leafNodes.push({ note: notes[li], angle: leafAngle, groupIdx: gi });
    }
    leafCursor += notes.length;
  }

  // Show/hide tooltip
  const showTooltip = useCallback(
    (
      evt: React.MouseEvent,
      label: string,
      sub?: string,
      score?: number,
      reasons?: string[]
    ) => {
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (!svgRect) return;
      setTooltip({
        visible: true,
        x: evt.clientX - svgRect.left + 12,
        y: evt.clientY - svgRect.top - 8,
        label,
        sub,
        score,
        reasons,
      });
    },
    []
  );

  const hideTooltip = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  // Label from path
  function labelFromPath(path: string): string {
    const stripped = path.replace(/\.md$/, '');
    const last = stripped.split('/').pop() ?? stripped;
    return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Empty state
  if (relatedNotes.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-[24px] border border-[var(--border-glass-soft)] bg-[var(--surf-canvas)]"
        style={{ width, height }}
        role="img"
        aria-label="No related notes"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="18"
            stroke="var(--border-glass)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
          <circle cx="20" cy="20" r="5" fill={accent} opacity="0.5" />
        </svg>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          No related notes found
        </p>
      </div>
    );
  }

  const rootPos = { x: cx, y: cy };
  const rootLabel = rootTitle || labelFromPath(rootPath);

  return (
    <div
      className="relative rounded-[24px] border border-[var(--border-glass-soft)] bg-[var(--surf-canvas)] overflow-hidden"
      style={{ width, height }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Knowledge graph: ${rootLabel} and ${relatedNotes.length} related notes`}
        style={{ display: 'block' }}
      >
        <title>{`Graph: ${rootLabel}`}</title>
        <desc>
          Radial dendrogram showing {rootLabel} at centre, grouped by
          collection, with {relatedNotes.length} related notes as leaves.
        </desc>

        {/* ── Background glow ────────────────────────────────────────────── */}
        <radialGradient id="ngd-bg-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="url(#ngd-bg-glow)"
        />

        {/* ── Root → Branch links ────────────────────────────────────────── */}
        {branchNodes.map((bn) => {
          const bp = toCartesian(cx, cy, branchRing, bn.angle);
          return (
            <path
              key={`link-root-${bn.groupIdx}`}
              d={linkPath(rootPos.x, rootPos.y, bp.x, bp.y, cx, cy)}
              fill="none"
              stroke={ACCENT_PALETTE[bn.groupIdx % ACCENT_PALETTE.length]}
              strokeWidth="1.5"
              strokeOpacity="0.45"
              style={{
                animation: `ngd-fade-in var(--duration-slow) var(--ease-enter) ${bn.groupIdx * 60}ms both`,
              }}
            />
          );
        })}

        {/* ── Branch → Leaf links ────────────────────────────────────────── */}
        {leafNodes.map((ln, i) => {
          const bn = branchNodes[ln.groupIdx];
          const bp = toCartesian(cx, cy, branchRing, bn.angle);
          const lp = toCartesian(cx, cy, leafRing, ln.angle);
          return (
            <path
              key={`link-leaf-${i}`}
              d={linkPath(bp.x, bp.y, lp.x, lp.y, cx, cy)}
              fill="none"
              stroke={ACCENT_PALETTE[ln.groupIdx % ACCENT_PALETTE.length]}
              strokeWidth="1"
              strokeOpacity="0.3"
              style={{
                animation: `ngd-fade-in var(--duration-slow) var(--ease-enter) ${100 + i * 40}ms both`,
              }}
            />
          );
        })}

        {/* ── Branch nodes ──────────────────────────────────────────────── */}
        {branchNodes.map((bn) => {
          const bp = toCartesian(cx, cy, branchRing, bn.angle);
          const paletteColor =
            ACCENT_PALETTE[bn.groupIdx % ACCENT_PALETTE.length];
          return (
            <g
              key={`branch-${bn.groupIdx}`}
              style={{
                animation: `ngd-scale-in var(--duration-slow) var(--ease-enter) ${80 + bn.groupIdx * 60}ms both`,
                transformOrigin: `${bp.x}px ${bp.y}px`,
              }}
            >
              <circle
                cx={bp.x}
                cy={bp.y}
                r={branchR}
                fill={paletteColor}
                fillOpacity="0.55"
                stroke={paletteColor}
                strokeWidth="1.5"
                strokeOpacity="0.8"
                onMouseEnter={(e) => showTooltip(e, bn.collection)}
                onMouseLeave={hideTooltip}
                style={{ cursor: 'default' }}
              />
              {/* Collection label — only show if space (branches aren't too close) */}
              {groups.length <= 6 && (
                <text
                  x={toCartesian(cx, cy, branchRing + branchR + 10, bn.angle).x}
                  y={toCartesian(cx, cy, branchRing + branchR + 10, bn.angle).y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontFamily="var(--font-sans)"
                  fill="var(--text-tertiary)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {bn.collection.length > 10
                    ? `${bn.collection.slice(0, 9)}…`
                    : bn.collection}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Leaf nodes ────────────────────────────────────────────────── */}
        {leafNodes.map((ln, i) => {
          const lp = toCartesian(cx, cy, leafRing, ln.angle);
          const paletteColor =
            ACCENT_PALETTE[ln.groupIdx % ACCENT_PALETTE.length];
          const r = leafR + ln.note.score * 4; // size scales with score
          const label = labelFromPath(ln.note.path);
          return (
            <g
              key={`leaf-${i}`}
              style={{
                animation: `ngd-scale-in var(--duration-slow) var(--ease-enter) ${180 + i * 40}ms both`,
                transformOrigin: `${lp.x}px ${lp.y}px`,
                cursor: onNodeClick ? 'pointer' : 'default',
              }}
              role="button"
              aria-label={`Note: ${label}, similarity ${Math.round(ln.note.score * 100)}%`}
              tabIndex={0}
              onMouseEnter={(e) =>
                showTooltip(
                  e,
                  label,
                  ln.note.path,
                  ln.note.score,
                  ln.note.reasons
                )
              }
              onMouseLeave={hideTooltip}
              onClick={() => onNodeClick?.(ln.note.path)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ')
                  onNodeClick?.(ln.note.path);
              }}
            >
              <circle
                cx={lp.x}
                cy={lp.y}
                r={r}
                fill={paletteColor}
                fillOpacity="0.35"
                stroke={paletteColor}
                strokeWidth="1.5"
                strokeOpacity="0.7"
              />
              <circle
                cx={lp.x}
                cy={lp.y}
                r={r - 3}
                fill={paletteColor}
                fillOpacity="0.15"
              />
            </g>
          );
        })}

        {/* ── Root node ─────────────────────────────────────────────────── */}
        <g
          style={{
            animation:
              'ngd-scale-in var(--duration-slow) var(--ease-enter) 0ms both',
            transformOrigin: `${cx}px ${cy}px`,
          }}
        >
          {/* Glow ring */}
          <circle
            cx={cx}
            cy={cy}
            r={rootR + 6}
            fill="none"
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.25"
            strokeDasharray="4 3"
          />
          {/* Root fill — lime→accent gradient */}
          <defs>
            <radialGradient id="ngd-root-fill" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor="var(--a-lime)" stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.75" />
            </radialGradient>
          </defs>
          <circle
            cx={cx}
            cy={cy}
            r={rootR}
            fill="url(#ngd-root-fill)"
            stroke={accent}
            strokeWidth="1.5"
            strokeOpacity="0.6"
          />
          {/* Root label */}
          <text
            x={cx}
            y={cy + rootR + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="500"
            fontFamily="var(--font-sans)"
            fill="var(--text-secondary)"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {rootLabel.length > 18 ? `${rootLabel.slice(0, 17)}…` : rootLabel}
          </text>
        </g>
      </svg>

      {/* ── Tooltip ───────────────────────────────────────────────────────── */}
      {tooltip.visible && (
        <div
          role="tooltip"
          style={{
            position: 'absolute',
            left: tooltip.x,
            top: tooltip.y,
            pointerEvents: 'none',
            zIndex: 10,
          }}
          className="max-w-[180px] rounded-[12px] border border-[var(--border-glass-soft)] bg-[var(--surf-elevated)] shadow-[var(--shadow-md)] px-3 py-2"
        >
          <p className="text-[11px] font-medium text-[var(--text-primary)] leading-snug">
            {tooltip.label}
          </p>
          {tooltip.sub && (
            <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5 break-all leading-tight">
              {tooltip.sub}
            </p>
          )}
          {tooltip.score !== undefined && (
            <p className="text-[10px] text-[var(--text-secondary)] mt-1">
              Similarity:{' '}
              <span className="font-semibold text-[var(--text-primary)]">
                {Math.round(tooltip.score * 100)}%
              </span>
            </p>
          )}
          {tooltip.reasons && tooltip.reasons.length > 0 && (
            <p className="text-[9px] text-[var(--text-tertiary)] mt-1 italic">
              {tooltip.reasons.join(', ')}
            </p>
          )}
        </div>
      )}

      {/* ── Keyframe styles injected inline ──────────────────────────────── */}
      <style>{`
        @keyframes ngd-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ngd-scale-in {
          from { opacity: 0; transform: scale(0.4); }
          to   { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="ngd-fade-in"], [style*="ngd-scale-in"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
