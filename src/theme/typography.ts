// Type system — mirrors the monorepo web app:
//   --font-sans:  "Inter Tight"  (body / UI)
//   --font-serif: "Fraunces"     (editorial headings)
//
// Font families are registered under these keys by `useFonts` in App.tsx.
// Inter Tight is applied globally as the default Text font (weight- and
// italic-aware, via theme/installFontDefaults). Fraunces is applied to headings via
// `fonts.serif*` in each screen's title styles. Custom fonts ship one file per
// weight/style, so every cut we use must be listed here AND loaded in App.tsx.

export const fonts = {
  // Inter Tight — body / UI
  sans:               'InterTight_400Regular',
  sansMedium:         'InterTight_500Medium',
  sansSemiBold:       'InterTight_600SemiBold',
  sansBold:           'InterTight_700Bold',
  sansItalic:         'InterTight_400Regular_Italic',
  sansMediumItalic:   'InterTight_500Medium_Italic',
  sansSemiBoldItalic: 'InterTight_600SemiBold_Italic',
  sansBoldItalic:     'InterTight_700Bold_Italic',

  // Fraunces — editorial headings
  serif:              'Fraunces_400Regular',
  serifMedium:        'Fraunces_500Medium',
  serifSemiBold:      'Fraunces_600SemiBold',
  serifBold:          'Fraunces_700Bold',
  serifItalic:        'Fraunces_400Regular_Italic',
  serifMediumItalic:  'Fraunces_500Medium_Italic',
} as const;
