import { View, Text, Image, StyleSheet } from 'react-native';
import { colors } from '../theme';
import CreditPill from './CreditPill';
import type { Venue } from '../types/venue';

type Props = {
  venue: Venue;
};

export default function CuratedVenueRow({ venue }: Props) {
  return (
    <View style={styles.row}>
      <Image source={{ uri: venue.imageUrl }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{venue.name}</Text>
        <Text style={styles.city}>{venue.city}</Text>
        {venue.category.length > 0 && (
          <View style={styles.chips}>
            {venue.category.slice(0, 2).map((cat) => (
              <View key={cat} style={styles.chip}>
                <Text style={styles.chipText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <CreditPill credits={venue.creditCost} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 10,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.paper,
  },
  city: {
    fontSize: 12,
    color: colors.paper3,
  },
  chips: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 2,
  },
  chip: {
    backgroundColor: colors.ink4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.paper2,
    letterSpacing: 0.4,
  },
});
