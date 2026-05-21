// Web stub for react-native-maps. The native library has no web bundle,
// so on web both MapView and Marker render nothing.  ExploreScreen falls
// back to its list view, which is what we want for the smoke test anyway.

import type { ReactNode } from 'react';

type AnyProps = Record<string, unknown> & { children?: ReactNode };

export default function MapView(_props: AnyProps) {
  return null;
}

export function Marker(_props: AnyProps) {
  return null;
}
