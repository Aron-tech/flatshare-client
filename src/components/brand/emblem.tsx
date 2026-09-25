import { THEME } from "@/constants/theme";
import Svg, { Path } from "react-native-svg";

/** FlatShare embléma (flatshare_emblem) – terrakotta tető, zsálya házak és levél. */
export function Emblem({ size = 32 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Path
        d="M8 29 32 10l24 19M15 23.5V29M49 23.5V29"
        stroke={THEME.light.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 38 20 28l6 5M56 38 44 28l-6 5M14 34v10a4 4 0 0 0 4 4h10c2.5 0 4-1.8 4-4V32M50 34v10a4 4 0 0 1-4 4H34"
        stroke={THEME.light.success}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M32 32c-5-3-6.5-10-0-16 6.5 6 5 13 0 16Z"
        stroke={THEME.light.success}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
