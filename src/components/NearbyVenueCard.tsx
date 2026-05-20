import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';
import type { Venue } from '../types/venue';

type Props = {
  venue: Venue;
};

export default function NearbyVenueCard({ venue }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.imageWrapper}>
        <Image source={{ uri: venue.imageUrl }} style={styles.image} />
        <View style={styles.creditBadge}>
          <Text style={styles.creditText}>{venue.creditCost} cr</Text>
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{venue.name}</Text>
        <Text style={styles.city} numberOfLines={1}>{venue.city}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  imageWrapper: {
    width: 170,
    height: 130,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  creditBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15,23,42,0.75)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  creditText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.skyBlue,
    letterSpacing: 0.5,
  },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.paper,
    letterSpacing: -0.1,
    marginBottom: 3,
  },
  city: {
    fontSize: 11,
    color: colors.paper3,
  },
});
