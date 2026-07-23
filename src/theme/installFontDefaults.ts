import { StyleSheet, Text, TextInput } from 'react-native';
import { fonts } from './typography';

// Global default font (Inter Tight), applied without touching the render
// pipeline. React Native has no font cascade and custom fonts ship one file per
// weight/style, so we can't rely on a bare `fontFamily`. Instead we wrap
// `StyleSheet.create` and inject the matching Inter Tight face into every text
// style that declares text intent (fontSize/fontWeight/fontStyle) but no
// `fontFamily` of its own. Styles that opt into Fraunces (fonts.serif*) already
// set `fontFamily`, so they're left untouched, and any explicit face wins.
//
// This module must be imported before any screen's `StyleSheet.create` runs —
// see index.ts, where it's the first import.

const interUpright: Record<string, string> = {
  '100': fonts.sans, '200': fonts.sans, '300': fonts.sans, '400': fonts.sans,
  normal: fonts.sans,
  '500': fonts.sansMedium,
  '600': fonts.sansSemiBold,
  '700': fonts.sansBold, '800': fonts.sansBold, '900': fonts.sansBold,
  bold: fonts.sansBold,
};

const interItalic: Record<string, string> = {
  '100': fonts.sansItalic, '200': fonts.sansItalic, '300': fonts.sansItalic,
  '400': fonts.sansItalic, normal: fonts.sansItalic,
  '500': fonts.sansMediumItalic,
  '600': fonts.sansSemiBoldItalic,
  '700': fonts.sansBoldItalic, '800': fonts.sansBoldItalic, '900': fonts.sansBoldItalic,
  bold: fonts.sansBoldItalic,
};

function interFor(style: { fontWeight?: string | number; fontStyle?: string }): string {
  const weight = String(style.fontWeight ?? '400');
  const table = style.fontStyle === 'italic' ? interItalic : interUpright;
  return table[weight] ?? (style.fontStyle === 'italic' ? fonts.sansItalic : fonts.sans);
}

function isTextStyle(s: any): boolean {
  return s && typeof s === 'object' && !Array.isArray(s) && !s.fontFamily &&
    (s.fontSize != null || s.fontWeight != null || s.fontStyle != null);
}

let installed = false;

export function installFontDefaults() {
  if (installed) return;
  installed = true;

  // 1) Inject Inter Tight into text styles built via StyleSheet.create.
  const origCreate = StyleSheet.create.bind(StyleSheet);
  (StyleSheet as any).create = function patchedCreate(styles: Record<string, any>) {
    const out: Record<string, any> = {};
    for (const key in styles) {
      const s = styles[key];
      out[key] = isTextStyle(s) ? { fontFamily: interFor(s), ...s } : s;
    }
    return origCreate(out);
  };

  // 2) Bare <Text>/<TextInput> with no style prop still get Inter Tight.
  const T = Text as any;
  const TI = TextInput as any;
  T.defaultProps = { ...(T.defaultProps || {}) };
  T.defaultProps.style = [{ fontFamily: fonts.sans }, T.defaultProps.style];
  TI.defaultProps = { ...(TI.defaultProps || {}) };
  TI.defaultProps.style = [{ fontFamily: fonts.sans }, TI.defaultProps.style];
}

installFontDefaults();
