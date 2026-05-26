import Svg, { Path } from 'react-native-svg';

type Props = {
  size?: number;
  color?: string;
};

/**
 * Custom profile icon (head + shoulders), converted from the Figma SVG.
 * Original viewBox is 25×28; we preserve the aspect ratio at any `size`.
 * Drop-in replacement for Ionicons wherever the Profile tab needs branding.
 */
export default function ProfileIcon({ size = 24, color = '#FFFFFF' }: Props) {
  return (
    <Svg
      width={size}
      height={(size * 28) / 25}
      viewBox="0 0 25 28"
      fill="none"
    >
      {/* Shoulders / torso */}
      <Path
        d="M0.75 23.41C0.75 21.5147 1.3558 19.697 2.43414 18.3568C3.51247 17.0166 4.97501 16.2637 6.5 16.2637H18C19.525 16.2637 20.9875 17.0166 22.0659 18.3568C23.1442 19.697 23.75 21.5147 23.75 23.41C23.75 24.3577 23.4471 25.2666 22.9079 25.9367C22.3688 26.6068 21.6375 26.9832 20.875 26.9832H3.625C2.8625 26.9832 2.13123 26.6068 1.59207 25.9367C1.0529 25.2666 0.75 24.3577 0.75 23.41Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* Head */}
      <Path
        d="M12.2499 11.4696C14.6317 11.4696 16.5624 9.0699 16.5624 6.10978C16.5624 3.14965 14.6317 0.75 12.2499 0.75C9.86821 0.75 7.93744 3.14965 7.93744 6.10978C7.93744 9.0699 9.86821 11.4696 12.2499 11.4696Z"
        stroke={color}
        strokeWidth={1.5}
      />
    </Svg>
  );
}
