// components/TradingCardBlank.tsx
import React, { ReactNode } from 'react';
import Svg, {
  Rect,
  Line,
  Circle,
  Path,
  Defs,
  ClipPath,
  G,
} from 'react-native-svg';

type BlankProps = {
  /** overall size; keep ratio ~5:7 yourself if you like */
  width?: number;
  height?: number;

  /** styling */
  ink?: string;           // stroke/fill color for outlines & dots
  frameStroke?: number;   // outer stroke width
  innerStroke?: number;   // inner stroke width

  /** toggles for lower UI */
  showLeftLines?: boolean;
  showRightDots?: boolean;
  showBottomRule?: boolean;

  /** show the default silhouette inside the portrait area */
  showPortraitSilhouette?: boolean;

  /**
   * Optional children rendered INSIDE the portrait rectangle (clipped).
   * You can position with absolute/SVG transforms relative to the portrait box.
   */
  children?: ReactNode;
};

/**
 * Full-size blank trading card frame (transparent background).
 * 5:7 ratio viewBox; portrait area fills the top half with padding.
 */
export default function TradingCardBlank({
  width = 500,
  height = 700,
  ink = '#111111',
  frameStroke = 20,
  innerStroke = 12,
  showLeftLines = true,
  showRightDots = true,
  showBottomRule = true,
  showPortraitSilhouette = true,
  children,
}: BlankProps) {
  // geometry (kept identical to the SVG you approved)
  const outer = { x: 39, y: 22, w: 422, h: 656, r: 28 };
  const inner = { x: 82, y: 82, w: 336, h: 536, r: 14 };

  const midY = 350; // inner.y + inner.h/2

  // portrait fits upper half of inner with ~14–18px padding
  const portrait = { x: 96, y: 100, w: 308, h: 232, r: 12 };

  // dots (3x3)
  const dots = [
    { cx: 305, cy: 432 }, { cx: 344, cy: 432 }, { cx: 383, cy: 432 },
    { cx: 305, cy: 492 }, { cx: 344, cy: 492 }, { cx: 383, cy: 492 },
    { cx: 305, cy: 552 }, { cx: 344, cy: 552 }, { cx: 383, cy: 552 },
  ];

  return (
    <Svg width={width} height={height} viewBox="0 0 500 700" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <ClipPath id="portraitClip">
          <Rect x={portrait.x} y={portrait.y} width={portrait.w} height={portrait.h} rx={portrait.r} />
        </ClipPath>
      </Defs>

      {/* outer & inner frames */}
      <Rect x={outer.x} y={outer.y} width={outer.w} height={outer.h} rx={outer.r}
            fill="none" stroke={ink} strokeWidth={frameStroke} />
      <Rect x={inner.x} y={inner.y} width={inner.w} height={inner.h} rx={inner.r}
            fill="none" stroke={ink} strokeWidth={innerStroke} />

      {/* center divider */}
      <Line x1={inner.x} y1={midY} x2={inner.x + inner.w} y2={midY}
            stroke={ink} strokeWidth={14} strokeLinecap="round" />

      {/* portrait area */}
      <Rect x={portrait.x} y={portrait.y} width={portrait.w} height={portrait.h} rx={portrait.r}
            fill="none" stroke={ink} strokeWidth={innerStroke} />

      {/* children clipped into portrait box */}
      {children && (
        <G clipPath="url(#portraitClip)">
          {children}
        </G>
      )}

      {/* default silhouette */}
      {showPortraitSilhouette && (
        <>
          <Circle cx={250} cy={170} r={36} fill="none" stroke={ink} strokeWidth={12} />
          <Path
            d="M170 260 a80 56 0 0 1 160 0 v18 h-160 z"
            fill="none" stroke={ink} strokeWidth={12} strokeLinejoin="round"
          />
        </>
      )}

      {/* lower-left text lines */}
      {showLeftLines && (
        <>
          <Line x1={152} y1={432} x2={250} y2={432} stroke={ink} strokeWidth={18} strokeLinecap="round" />
          <Line x1={152} y1={492} x2={250} y2={492} stroke={ink} strokeWidth={18} strokeLinecap="round" />
          <Line x1={152} y1={552} x2={250} y2={552} stroke={ink} strokeWidth={18} strokeLinecap="round" />
        </>
      )}

      {/* lower-right dots */}
      {showRightDots && dots.map((d, i) => (
        <Circle key={i} cx={d.cx} cy={d.cy} r={10} fill={ink} />
      ))}

      {/* bottom rule */}
      {showBottomRule && (
        <Line x1={148} y1={618} x2={390} y2={618} stroke={ink} strokeWidth={16} strokeLinecap="round" />
      )}
    </Svg>
  );
}

/** A compact, square-friendly icon version for small buttons/tiles with ALL details. */
export function TradingCardIcon({
  size = 24,
  ink = '#111111',
}: { size?: number; ink?: string }) {
  // Full detailed version including the portrait silhouette
  return (
    <Svg width={size} height={size} viewBox="0 0 500 700" preserveAspectRatio="xMidYMid meet">
      {/* Outer frame */}
      <Rect x={39} y={22} width={422} height={656} rx={28} fill="none" stroke={ink} strokeWidth={28} />
      {/* Inner frame */}
      <Rect x={82} y={82} width={336} height={536} rx={14} fill="none" stroke={ink} strokeWidth={16} />
      {/* Center divider */}
      <Line x1={82} y1={350} x2={418} y2={350} stroke={ink} strokeWidth={20} strokeLinecap="round" />
      {/* Portrait area */}
      <Rect x={96} y={100} width={308} height={232} rx={12} fill="none" stroke={ink} strokeWidth={14} />
      {/* Portrait silhouette - the "little guy" */}
      <Circle cx={250} cy={170} r={36} fill="none" stroke={ink} strokeWidth={14} />
      <Path
        d="M170 260 a80 56 0 0 1 160 0 v18 h-160 z"
        fill="none" stroke={ink} strokeWidth={14} strokeLinejoin="round"
      />
      {/* Lower left lines */}
      <Line x1={152} y1={432} x2={250} y2={432} stroke={ink} strokeWidth={18} strokeLinecap="round" />
      <Line x1={152} y1={492} x2={250} y2={492} stroke={ink} strokeWidth={18} strokeLinecap="round" />
      <Line x1={152} y1={552} x2={250} y2={552} stroke={ink} strokeWidth={18} strokeLinecap="round" />
      {/* Lower right dots */}
      <Circle cx={305} cy={432} r={10} fill={ink} />
      <Circle cx={344} cy={432} r={10} fill={ink} />
      <Circle cx={383} cy={432} r={10} fill={ink} />
      <Circle cx={305} cy={492} r={10} fill={ink} />
      <Circle cx={344} cy={492} r={10} fill={ink} />
      <Circle cx={383} cy={492} r={10} fill={ink} />
      <Circle cx={305} cy={552} r={10} fill={ink} />
      <Circle cx={344} cy={552} r={10} fill={ink} />
      <Circle cx={383} cy={552} r={10} fill={ink} />
      {/* Bottom rule */}
      <Line x1={148} y1={618} x2={390} y2={618} stroke={ink} strokeWidth={16} strokeLinecap="round" />
    </Svg>
  );
}