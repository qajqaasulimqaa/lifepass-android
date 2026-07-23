export const colors = {
  // Surfaces — warm paper, editorial (light theme).
  // Token names are kept from the previous dark theme so the whole app
  // re-themes from this one file; `ink*` are page/surface fills, `paper*` is text.
  ink:   '#F7F5EF',  // page base — warm off-white
  ink2:  '#F0EDE3',  // cards, sheets — slightly recessed
  ink3:  '#EAE6D9',  // elevated surfaces
  ink4:  '#E3DECF',  // inner surfaces, chips

  // Borders — dark hairlines on paper
  line:  'rgba(15,23,42,0.08)',   // hairline
  line2: 'rgba(15,23,42,0.14)',   // stronger

  // Text — deep ink
  paper:  '#0F172A',
  paper2: 'rgba(15,23,42,0.72)',
  paper3: 'rgba(15,23,42,0.52)',
  paper4: 'rgba(15,23,42,0.32)',

  // Accents
  blue:        '#3F79BA',
  blueMid:     '#6295CE',
  blueWash:    'rgba(63,121,186,0.12)',
  skyBlue:     '#2F6DA3',  // signal / luxury accents — deep glacier, reads on paper
  moss:        '#3E8F7C',  // success
  destructive: '#C2464B',  // error / warning


} as const;
