import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface CollectionIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const CollectionIcon: React.FC<CollectionIconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  strokeWidth = 1.5 
}) => {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Top shelf */}
      <Path d="M3 8h18" />
      {/* Middle shelf */}
      <Path d="M3 14h18" />
      {/* Bottom shelf */}
      <Path d="M3 20h18" />
      
      {/* Items on top shelf */}
      <Rect x="5" y="4" width="3" height="3" rx="0.5" />
      <Rect x="10" y="5" width="2" height="2" rx="0.5" />
      <Rect x="14" y="4.5" width="3" height="2.5" rx="0.5" />
      
      {/* Items on middle shelf */}
      <Rect x="5" y="10" width="2.5" height="3" rx="0.5" />
      <Rect x="9" y="10.5" width="3" height="2.5" rx="0.5" />
      <Rect x="14" y="10" width="2" height="3" rx="0.5" />
      
      {/* Items on bottom shelf */}
      <Rect x="5" y="16.5" width="3" height="2.5" rx="0.5" />
      <Rect x="10" y="16" width="2" height="3" rx="0.5" />
      <Rect x="14" y="16.5" width="3.5" height="2.5" rx="0.5" />
    </Svg>
  );
};

export default CollectionIcon;