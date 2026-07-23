// The AI Coach chat is a full-bleed immersive surface over a dark photo
// (assets/bg-chat.jpg). It stays dark (light text on the photo), but uses a
// WARM near-black palette — not navy — so it carries the same warm/editorial
// cast as the rest of the light theme instead of a blue hue. Same shape as
// theme/colors so the coach files only import `colors` from here.
export const colors = {
  // Surfaces — warm near-black / charcoal
  ink:   '#1B1712',
  ink2:  '#241F18',
  ink3:  '#2E271E',
  ink4:  '#392F24',

  // Borders (warm light hairlines)
  line:  'rgba(245,240,230,0.10)',
  line2: 'rgba(245,240,230,0.16)',

  // Text — warm off-white
  paper:  '#F5F1EA',
  paper2: 'rgba(245,241,234,0.72)',
  paper3: 'rgba(245,241,234,0.48)',
  paper4: 'rgba(245,241,234,0.28)',

  // Accents
  blue:        '#3F79BA',
  blueMid:     '#6295CE',
  blueWash:    'rgba(63,121,186,0.18)',
  skyBlue:     '#A8D8F0',
  moss:        '#5EB3A5',
  destructive: '#D36363',
} as const;
