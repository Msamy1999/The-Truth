import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../lib/theme";

/**
 * The Straight Path logo mark: a straight road in perspective, open at the
 * horizon, receding toward a white light with a warm gold glow. Mirrors
 * public/logo-mark.svg on the website; road strokes default to the theme
 * accent so the mark adapts to light and dark schemes.
 */
export function LogoMark({
  size = 32,
  color,
}: {
  /** Rendered width/height in points. */
  size?: number;
  /** Stroke color for the road (the gold-glow light keeps brand gold). */
  color?: string;
}) {
  const theme = useTheme();
  const stroke = color ?? theme.accent;

  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="The Straight Path logo"
    >
      {/* The white light at the end of the road, with a warm glow */}
      <Circle cx={32} cy={15.5} r={11} fill="#C8951E" opacity={0.18} />
      <Circle cx={32} cy={15.5} r={7} fill="#C8951E" opacity={0.4} />
      <Circle cx={32} cy={15.5} r={4.2} fill="#FFFFFF" stroke="#C8951E" strokeWidth={1.6} />
      {/* The straight road, in perspective, open at the horizon */}
      <Path d="M15 58 L26.8 27" stroke={stroke} strokeWidth={4.6} strokeLinecap="round" />
      <Path d="M49 58 L37.2 27" stroke={stroke} strokeWidth={4.6} strokeLinecap="round" />
      {/* Center line receding toward the light */}
      <Path
        d="M32 55.5 L32 49.5"
        stroke={stroke}
        strokeWidth={3.4}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M32 44 L32 39"
        stroke={stroke}
        strokeWidth={2.7}
        strokeLinecap="round"
        opacity={0.6}
      />
      <Path
        d="M32 34 L32 30.5"
        stroke={stroke}
        strokeWidth={2.1}
        strokeLinecap="round"
        opacity={0.6}
      />
    </Svg>
  );
}
