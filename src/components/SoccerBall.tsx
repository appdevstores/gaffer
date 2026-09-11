// §5 Rule B — realistic soccer ball (offline-drawn SVG, no assets).
// Classic truncated-icosahedron front view: white sphere with a central dark
// pentagon, three edge pentagons, connecting seams, and a soft radial sheen.

import React from 'react';
import Svg, { Circle, Defs, Line, Path, Polygon, RadialGradient, Stop } from 'react-native-svg';

interface Props {
  size?: number;
}

// Pentagon coordinates in a 32×32 viewBox (center 16,16, ball radius 15).
const CENTER_PENTAGON =
  '16,10.5 10.77,14.3 12.77,20.45 19.23,20.45 21.23,14.3';
const TOP_PENTAGON = '16,9.5 19.8,6.74 18.35,2.26 13.65,2.26 12.2,6.74';
const BOTTOM_LEFT_PENTAGON = '9.68,28.25 9.97,24.15 6.15,22.6 3.51,24.24 5.69,29.25';
const BOTTOM_RIGHT_PENTAGON = '27.6,23.66 23.58,22.8 21.52,26.37 24.27,29.42 28.03,27.75';

// Seams radiating from the central pentagon's vertices out to the ball edge.
const SEAMS = [
  'M16 10.5 L16 1',
  'M10.77 14.3 L1.73 11.36',
  'M12.77 20.45 L7.18 28.13',
  'M19.23 20.45 L24.82 28.13',
  'M21.23 14.3 L30.27 11.36',
];

const SEAM_COLOR = '#0f172a';

export default function SoccerBall({ size = 20 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Defs>
        <RadialGradient id="ballSheen" cx="35%" cy="28%" r="85%">
          <Stop offset="0%" stopColor="#ffffff" />
          <Stop offset="55%" stopColor="#eef2f7" />
          <Stop offset="100%" stopColor="#b6c2d4" />
        </RadialGradient>
      </Defs>

      {/* sphere */}
      <Circle cx={16} cy={16} r={15} fill="url(#ballSheen)" stroke={SEAM_COLOR} strokeWidth={0.9} />

      {/* seams */}
      {SEAMS.map((d) => (
        <Path key={d} d={d} stroke={SEAM_COLOR} strokeWidth={0.55} fill="none" />
      ))}
      {/* short seams connecting the edge pentagons */}
      <Line x1={12.2} y1={6.74} x2={10.77} y2={14.3} stroke={SEAM_COLOR} strokeWidth={0.45} />
      <Line x1={19.8} y1={6.74} x2={21.23} y2={14.3} stroke={SEAM_COLOR} strokeWidth={0.45} />
      <Line x1={3.51} y1={24.24} x2={10.77} y2={14.3} stroke={SEAM_COLOR} strokeWidth={0.45} />
      <Line x1={28.03} y1={27.75} x2={21.23} y2={14.3} stroke={SEAM_COLOR} strokeWidth={0.45} />

      {/* dark pentagons */}
      <Polygon points={CENTER_PENTAGON} fill={SEAM_COLOR} />
      <Polygon points={TOP_PENTAGON} fill={SEAM_COLOR} />
      <Polygon points={BOTTOM_LEFT_PENTAGON} fill={SEAM_COLOR} />
      <Polygon points={BOTTOM_RIGHT_PENTAGON} fill={SEAM_COLOR} />
    </Svg>
  );
}
