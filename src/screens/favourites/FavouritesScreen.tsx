import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme';
import { mockVenues } from '../../data/mockVenues';
import { mockFavouriteVenueIds, mockFavouriteActivities } from '../../data/mockFavourites';
import BrandedTopBar from '../../components/BrandedTopBar';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import EmptyState from '../../components/EmptyState';
import type { Venue } from '../../types/venue';
import type { FavouritesStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<FavouritesStackParamList>;

const STUB_CREDITS = 12;

export default function FavouritesScreen() {
  const navigation = useNavigation<Nav>();
  const openVenue = (venueId: string) => navigation.navigate('VenueDetail', { venueId });

  const savedVenues = mockVenues.filter((v) => mockFavouriteVenueIds.includes(v.id));
  const savedActivities = mockFavouriteActivities;
  const suggestions = mockVenues
    .filter((v) => !mockFavouriteVenueIds.includes(v.id))
    .slice(0, 3);

  return (
    <View style={styles.container}>
      <BrandedTopBar title="Saved" subtitle="Venues & classes" credits={STUB_CREDITS} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.heading}>Your spots</Text>
          <Kicker text={`${savedVenues.length} saved`} color={colors.paper3} />
        </View>

        {/* Saved venues */}
        {savedVenues.length === 0 ? (
          <EmptyState icon="heart-outline" message="No saved venues yet." actionLabel="Find venues" onAction={() => {}} />
        ) : (
          <View style={styles.list}>
            {savedVenues.map((venue) => (
              <TouchableOpacity key={venue.id} activeOpacity={0.85} onPress={() => openVenue(venue.id)}>
                <SavedVenueRow venue={venue} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Saved classes */}
        {savedActivities.length > 0 && (
          <View style={styles.section}>
            <Kicker text="Saved classes" color={colors.paper3} />
            <View style={styles.list}>
              {savedActivities.map((activity) => (
                <View key={activity.id} style={activityRowStyles.row}>
                  <Image source={{ uri: activity.imageUrl }} style={activityRowStyles.image} />
                  <View style={activityRowStyles.info}>
                    <Text style={activityRowStyles.name}>{activity.name}</Text>
                    <Text style={activityRowStyles.credits}>
                      {activity.creditCost} credit{activity.creditCost === 1 ? '' : 's'}
                    </Text>
                  </View>
                  <Ionicons name="heart" size={14} color={colors.blueMid} />
                  <Ionicons name="chevron-forward" size={12} color={colors.paper3} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Suggestions */}
        <View style={suggestStyles.container}>
          <LinearGradient
            colors={[colors.ink2, colors.ink3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={suggestStyles.headerRow}>
            <Ionicons name="sparkles" size={12} color={colors.skyBlue} />
            <Kicker text="For you" color={colors.skyBlue} />
          </View>
          <Text style={suggestStyles.heading}>Based on your saved spots</Text>

          <View style={suggestStyles.list}>
            {suggestions.map((venue) => (
              <TouchableOpacity key={venue.id} activeOpacity={0.85} onPress={() => openVenue(venue.id)}>
                <SuggestionRow venue={venue} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function SavedVenueRow({ venue }: { venue: Venue }) {
  return (
    <View style={rowStyles.row}>
      <Image source={{ uri: venue.imageUrl }} style={rowStyles.image} />
      <View style={rowStyles.info}>
        <Text style={rowStyles.name}>{venue.name}</Text>
        <Text style={rowStyles.city}>
          {venue.city} · {venue.walkInsAllowed ? 'Walk-ins welcome' : 'Pre-book required'}
        </Text>
        <View style={rowStyles.savedRow}>
          <Ionicons name="heart" size={10} color={colors.blueMid} />
          <Text style={rowStyles.savedText}>Saved</Text>
        </View>
      </View>
      <CreditPill credits={venue.creditCost} compact />
    </View>
  );
}

function SuggestionRow({ venue }: { venue: Venue }) {
  const reason =
    venue.classification === 'luxury'
      ? 'Similar to your lagoons'
      : venue.category[0]
        ? `You liked ${venue.category[0]}`
        : 'Near your saved spots';

  return (
    <View style={suggestStyles.row}>
      <Image source={{ uri: venue.imageUrl }} style={suggestStyles.image} />
      <View style={suggestStyles.rowInfo}>
        <Text style={suggestStyles.rowName}>{venue.name}</Text>
        <Text style={suggestStyles.rowReason} numberOfLines={1}>{reason}</Text>
      </View>
      <TouchableOpacity style={suggestStyles.addButton}>
        <Ionicons name="heart-outline" size={12} color={colors.paper} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 140, gap: 28 },
  header: { gap: 4, paddingHorizontal: 4 },
  heading: { fontSize: 22, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  list: { gap: 10 },
  section: { gap: 12 },
});

const rowStyles = StyleSheet.create({
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
  image: { width: 72, height: 72, borderRadius: 10 },
  info: { flex: 1, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: colors.paper },
  city: { fontSize: 12, color: colors.paper3 },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  savedText: { fontSize: 11, fontWeight: '600', color: colors.blueMid },
});

const activityRowStyles = StyleSheet.create({
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
  image: { width: 56, height: 56, borderRadius: 10 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '600', color: colors.paper },
  credits: { fontSize: 12, color: colors.skyBlue },
});

const suggestStyles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.line,
    overflow: 'hidden',
    gap: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { fontSize: 22, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  list: { gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  image: { width: 48, height: 48, borderRadius: 8 },
  rowInfo: { flex: 1, gap: 1 },
  rowName: { fontSize: 13.5, fontWeight: '600', color: colors.paper },
  rowReason: { fontSize: 11, color: colors.paper3, fontStyle: 'italic' },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ink3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line2,
  },
});
