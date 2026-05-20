export const colors = {
  // Surfaces
  ink:   '#0F172A',  // page base
  ink2:  '#142139',  // cards, sheets
  ink3:  '#0A1F3D',  // navy elevated
  ink4:  '#162952',  // inner surfaces, chips

  // Borders
  line:  'rgba(230,242,255,0.08)',   // hairline
  line2: 'rgba(230,242,255,0.14)',   // stronger

  // Text
  paper:  '#F1F5F9',
  paper2: 'rgba(241,245,249,0.72)',
  paper3: 'rgba(241,245,249,0.48)',
  paper4: 'rgba(241,245,249,0.28)',

  // Accents
  blue:        '#0088FF',
  blueMid:     '#3AA1FF',
  blueWash:    'rgba(0,136,255,0.18)',
  skyBlue:     '#A8D8F0',  // signal / luxury accents
  moss:        '#5EB3A5',  // success
  destructive: '#D36363',  // error / warning
} as const;
