// components/CoinDollarIcon.tsx
import React from 'react';
import { ViewStyle } from 'react-native';
import Svg, { Circle, Path, Defs, Mask, Rect, Text as SvgText } from 'react-native-svg';

type Props = {
  /** Overall icon size in px (width=height) */
  size?: number;
  /** Fill color for the coin (what was previously line color) */
  color?: string;
  /** Stroke width for the rings and $ cutout */
  strokeWidth?: number;
  /** Show/Hide the dashed "reeded" ring */
  reeded?: boolean;
  /** Optional style for wrapping <Svg> */
  style?: ViewStyle;
  /** Font family for the $ glyph (falls back to system) */
  fontFamily?: string;
  /** Font weight (e.g., '800', '700') */
  fontWeight?: string | number;
  /** Nudge the $ vertically if needed (e.g., '0.06em', '1') */
  dy?: string | number;
};

const CoinDollarIcon: React.FC<Props> = ({
  size = 256,
  color = '#111',
  strokeWidth = 8,
  reeded = true,
  style,
  fontFamily = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  fontWeight = '800',
  dy = '0.06em',
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      style={style}
      accessibilityRole="image"
      aria-label="Coin with dollar sign"
    >
      <Defs>
        {/* Mask defines what's visible (white) vs transparent (black) */}
        <Mask id="coinMask">
          {/* Start with everything visible */}
          <Rect x="0" y="0" width="256" height="256" fill="white" />
          
          {/* Cut out the outer rim stroke */}
          <Circle
            cx="128"
            cy="128"
            r="108"
            fill="none"
            stroke="black"
            strokeWidth={strokeWidth}
          />
          
          {/* Cut out the reeded ring */}
          {reeded && (
            <Circle
              cx="128"
              cy="128"
              r="96"
              fill="none"
              stroke="black"
              strokeWidth={Math.max(1, strokeWidth - 2)}
              strokeDasharray="6 10"
              opacity={0.55}
            />
          )}
          
          {/* Cut out the inner ring stroke */}
          <Circle
            cx="128"
            cy="128"
            r="78"
            fill="none"
            stroke="black"
            strokeWidth={strokeWidth}
          />
          
          {/* Cut out the $ sign */}
          <SvgText
            x="128"
            y="128"
            textAnchor="middle"
            alignmentBaseline="middle"
            dy={dy}
            fontFamily={fontFamily}
            fontSize={112}
            fontWeight={fontWeight}
            fill="black"
            stroke="black"
            strokeWidth={2}
          >
            $
          </SvgText>
        </Mask>
      </Defs>
      
      {/* Filled circle with mask applied */}
      <Circle
        cx="128"
        cy="128"
        r="116"
        fill={color}
        mask="url(#coinMask)"
      />
    </Svg>
  );
};

export default React.memo(CoinDollarIcon);