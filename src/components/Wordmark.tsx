import { Image } from 'react-native';

type Props = {
  /** Rendered height; width follows the wordmark's 450:116 aspect ratio. */
  height?: number;
  color?: string;
};

// Official LifePass wordmark — the same asset lifepass-ios ships
// (Assets.xcassets/lifepass_logo.imageset), recoloured to white with
// alpha preserved so tintColor can repaint it any colour.
const WORDMARK = require('../../assets/LifePass2-white logo.png');

export default function Wordmark({ height = 20, color = '#FFFFFF' }: Props) {
  return (
    <Image
      source={WORDMARK}
      style={{
        height,
        width: (height * 450) / 116,
        resizeMode: 'contain',
        tintColor: color,
      }}
    />
  );
}
