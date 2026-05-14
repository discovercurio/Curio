import React from 'react';
import Svg, { G, Circle, Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
  strokeWidth?: number;       // magnifier stroke
  plusStrokeWidth?: number;   // thinner plus stroke
};

const CurioSearchPlusIcon: React.FC<Props> = ({
  size = 24,
  color = '#203C61',
  strokeWidth = 1.8,
  plusStrokeWidth = 0.6,
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      {/* Magnifier */}
      <G fill="none" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth={strokeWidth}>
        <Circle cx="10" cy="10" r="6" />
        {/* Handle starts just outside the lens to create a clean gap */}
        <Path d="M14.65 14.65 L19.5 19.5" />
      </G>

      {/* Larger, thinner plus */}
      <G
        fill="none"
        stroke={color}
        strokeWidth={plusStrokeWidth}
        strokeLinecap="butt"
        strokeLinejoin="miter"
        vectorEffect="non-scaling-stroke"
      >
        <Path d="M20.5 2.5 L20.5 6.5" />
        <Path d="M18.5 4.5 L22.5 4.5" />
      </G>
    </Svg>
  );
};

export default CurioSearchPlusIcon;
