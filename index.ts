// Must run before any screen's StyleSheet.create — installs the app-wide
// Inter Tight default font. Keep this as the first import.
import './src/theme/installFontDefaults';

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
