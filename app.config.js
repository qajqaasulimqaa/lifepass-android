// Dynamic Expo config layered on top of the static app.json.
//
// Its only job is to inject the @rnmapbox/maps config plugin with the Mapbox
// *download* token pulled from the environment, so that secret never lives in
// source control. Everything else stays in app.json; Expo loads app.json first
// and hands it to this function as `config`.
//
// Tokens (create both in your Mapbox account → Tokens):
//   MAPBOX_DOWNLOAD_TOKEN     secret `sk.…` token, scope Downloads:Read. Used by
//                             gradle/CocoaPods to fetch the native Mapbox SDK at
//                             BUILD time. Native builds fail without it. Set it
//                             as an EAS secret (eas secret:create) and in local
//                             .env for local prebuilds. Never commit it.
//   EXPO_PUBLIC_MAPBOX_TOKEN  public `pk.…` token, used at RUNTIME by
//                             Mapbox.setAccessToken() (see components/VenueMap).
//                             Safe to expose; set it in eas.json env / .env.
module.exports = ({ config }) => {
  config.plugins = [
    ...(config.plugins ?? []),
    ['@rnmapbox/maps', { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN }],
  ];
  return config;
};
