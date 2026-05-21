// Native-only re-export of react-native-maps.
// On web, Metro resolves MapView.web.tsx instead (which stubs these out)
// because react-native-maps imports native-only code that can't be bundled
// for web.

export { default } from 'react-native-maps';
export { Marker } from 'react-native-maps';
