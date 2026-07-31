// Web stub for VenueMap. The Mapbox native SDK doesn't bundle under
// react-native-web, and the map isn't a web shipping target, so render a simple
// placeholder to keep `expo start --web` building. Metro resolves this file over
// VenueMap.tsx on web automatically.
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { Venue } from '../types/venue';

type Props = {
  venues: Venue[];
  selectedVenueId: string | null;
  onSelect: (venueId: string) => void;
};

export default function VenueMap(_props: Props) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.stub]}>
      <Text style={styles.text}>Map is available in the mobile app.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stub: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.ink },
  text: { color: colors.paper3, fontSize: 13 },
});
