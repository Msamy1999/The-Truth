import Svg, { Circle, Path } from "react-native-svg";
import { useTheme } from "../lib/theme";

/**
 * The Straight Path logo mark: three wandering paths merging into one
 * straight path with a gold destination point. Mirrors public/logo-mark.svg
 * on the website; strokes default to the theme accent so the mark adapts to
 * light and dark schemes.
 */
export function LogoMark({
  size = 32,
  color,
}: {
  /** Rendered width/height in points. */
  size?: number;
  /** Stroke color for the paths (the gold dot stays brand gold). */
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
      <Path
        d="M6 13 C 16 13, 21 30, 29.5 31.7"
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.45}
      />
      <Path
        d="M6 32 C 12 27.5, 17 36.5, 29.5 32"
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.65}
      />
      <Path
        d="M6 51 C 16 51, 21 34, 29.5 32.3"
        stroke={stroke}
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.45}
      />
      <Path
        d="M30 32 L51 32"
        stroke={stroke}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Circle cx={57.5} cy={32} r={3.4} fill="#C8951E" />
    </Svg>
  );
}
