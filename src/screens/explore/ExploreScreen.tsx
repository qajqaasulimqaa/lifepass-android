import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ExploreStackParamList>;
import { colors } from '../../theme';
import { mockVenues } from '../../data/mockVenues';
import { categoryFilters, matchesCategory } from '../../data/categories';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import type { Venue } from '../../types/venue';

type Presentation = 'map' | 'list';
type ClassFilter = 'all' | 'basic' | 'luxury';

const CLASS_FILTERS: { id: ClassFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basic', label: 'Basic' },
  { id: 'luxury', label: 'Luxury' },
];

const STUB_CREDITS = 12;

const REYKJAVIK = {
  latitude: 64.1466,
  longitude: -21.9426,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  function openVenue(venueId: string) {
    navigation.navigate('VenueDetail', { venueId });
  }
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation>('list');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return mockVenues.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (classFilter === 'basic' && v.classification === 'luxury') return false;
      if (classFilter === 'luxury' && v.classification !== 'luxury') return false;
      if (categoryFilter && !matchesCategory(v.category, categoryFilter)) return false;
      return true;
    });
  }, [search, classFilter, categoryFilter]);

  function classCount(f: ClassFilter) {
    return mockVenues.filter((v) =>
      f === 'all' ? true : f === 'luxury' ? v.classification === 'luxury' : v.classification !== 'luxury'
    ).length;
  }

  function categoryCount(filterId: string) {
    return mockVenues.filter((v) => matchesCategory(v.category, filterId)).length;
  }

  const selectedVenue = selectedVenueId
    ? mockVenues.find((v) => v.id === selectedVenueId) ?? null
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.wordmark}>
            <Text style={styles.wordmarkLife}>Life</Text>
            <Text style={styles.wordmarkPass}>Pass</Text>
          </Text>
        </View>
        <View style={styles.topBarCenter}>
          <Kicker text="Explore" color={colors.paper2} />
          <Kicker text={`${filtered.length} venues`} color={colors.paper3} />
        </View>
        <CreditPill credits={STUB_CREDITS} />
      </View>

      {/* Search + toggle */}
      <View style={styles.searchRow}>
        <View style={styles.searchField}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search venues..."
            placeholderTextColor={colors.paper3}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setPresentation(presentation === 'map' ? 'list' : 'map')}
        >
          <Text style={styles.toggleIcon}>{presentation === 'map' ? '≡' : '⊞'}</Text>
        </TouchableOpacity>
      </View>

      {/* Class chips */}
      <View style={styles.classChips}>
        {CLASS_FILTERS.map((f) => {
          const selected = classFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setClassFilter(f.id)}
            >
              {f.id === 'luxury' && (
                <View style={styles.luxuryDot} />
              )}
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {f.label}
              </Text>
              <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>
                {classCount(f.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChips}
        style={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[styles.chip, !categoryFilter && styles.chipSelected]}
          onPress={() => setCategoryFilter(null)}
        >
          <Text style={[styles.chipText, !categoryFilter && styles.chipTextSelected]}>All</Text>
          <Text style={[styles.chipCount, !categoryFilter && styles.chipTextSelected]}>
            {mockVenues.length}
          </Text>
        </TouchableOpacity>
        {categoryFilters.map((f) => {
          const selected = categoryFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setCategoryFilter(selected ? null : f.id)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {f.displayName}
              </Text>
              <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>
                {categoryCount(f.id)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {presentation === 'map' ? (
        <View style={styles.mapContainer}>
          <MapView style={StyleSheet.absoluteFill} initialRegion={REYKJAVIK}>
            {filtered.map((venue) => (
              <Marker
                key={venue.id}
                coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
                onPress={() => setSelectedVenueId(venue.id)}
              >
                <View style={[styles.marker, selectedVenueId === venue.id && styles.markerSelected]}>
                  <Text style={styles.markerPin}>📍</Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {selectedVenue && (
            <TouchableOpacity
              style={styles.venuePopup}
              activeOpacity={0.85}
              onPress={() => openVenue(selectedVenue.id)}
            >
              <Image source={{ uri: selectedVenue.imageUrl }} style={styles.popupImage} />
              <View style={styles.popupInfo}>
                <Text style={styles.popupName} numberOfLines={1}>{selectedVenue.name}</Text>
                <Text style={styles.popupCity}>{selectedVenue.city}</Text>
              </View>
              <CreditPill credits={selectedVenue.creditCost} compact />
              <Text style={styles.popupArrow}>→</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<EditorialBanner />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.85} onPress={() => openVenue(item.id)}>
              <ExploreListRow venue={item} />
            </TouchableOpacity>
          )}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      )}
    </View>
  );
}

function EditorialBanner() {
  const hero = mockVenues.find((v) => v.classification === 'luxury') ?? mockVenues[0];
  return (
    <View style={bannerStyles.container}>
      <Image source={{ uri: hero.imageUrl }} style={bannerStyles.image} />
      <LinearGradient
        colors={['rgba(15,23,42,0.05)', 'rgba(15,23,42,0.90)']}
        locations={[0.4, 1.0]}
        style={StyleSheet.absoluteFill}
      />
      <View style={bannerStyles.copy}>
        <Kicker text="Editorial" color={colors.skyBlue} />
        <Text style={bannerStyles.title}>
          Six lagoons for{' '}
          <Text style={bannerStyles.italic}>long weekends</Text>
        </Text>
      </View>
    </View>
  );
}

function ExploreListRow({ venue }: { venue: Venue }) {
  return (
    <View style={rowStyles.row}>
      <Image source={{ uri: venue.imageUrl }} style={rowStyles.image} />
      <View style={rowStyles.info}>
        <View style={rowStyles.nameRow}>
          {venue.classification === 'luxury' && <View style={rowStyles.luxuryDot} />}
          <Text style={rowStyles.name}>{venue.name}</Text>
        </View>
        <Text style={rowStyles.city}>
          {venue.city}{venue.walkInsAllowed ? ' · Walk-ins' : ''}
        </Text>
        {venue.category.length > 0 && (
          <View style={rowStyles.chips}>
            {venue.category.slice(0, 2).map((cat) => (
              <View key={cat} style={rowStyles.chip}>
                <Text style={rowStyles.chipText}>{cat}</Text>
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
  container: { flex: 1, backgroundColor: colors.ink },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
    backgroundColor: colors.ink,
  },
  wordmark: { fontSize: 18 },
  wordmarkLife: { color: colors.paper, fontStyle: 'italic', fontWeight: '400' },
  wordmarkPass: { color: colors.paper, fontWeight: '700' },
  topBarCenter: { alignItems: 'center', gap: 2 },

  searchRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingHorizontal: 14,
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 14, color: colors.paper },
  toggleButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink2,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  toggleIcon: { fontSize: 18, color: colors.paper },

  classChips: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  categoryScroll: { marginBottom: 10 },
  categoryChips: { paddingHorizontal: 20, gap: 8, paddingVertical: 4 },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.ink2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipSelected: {
    backgroundColor: colors.paper,
    borderColor: colors.paper,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.paper2,
    letterSpacing: -0.1,
  },
  chipTextSelected: { color: colors.ink },
  chipCount: { fontSize: 11, color: colors.paper3, opacity: 0.8 },
  luxuryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.skyBlue },

  // Map
  mapContainer: { flex: 1 },
  marker: { padding: 4 },
  markerSelected: { transform: [{ scale: 1.3 }] },
  markerPin: { fontSize: 24 },
  venuePopup: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line2,
  },
  popupImage: { width: 56, height: 56, borderRadius: 8 },
  popupInfo: { flex: 1 },
  popupName: { fontSize: 14, fontWeight: '600', color: colors.paper },
  popupCity: { fontSize: 12, color: colors.paper3 },
  popupArrow: { fontSize: 14, color: colors.paper3 },

  // List
  list: { paddingTop: 6, paddingHorizontal: 20 },
});

const bannerStyles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  image: { ...StyleSheet.absoluteFillObject },
  copy: { padding: 16, gap: 4 },
  title: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -0.4,
  },
  italic: { fontStyle: 'italic' },
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
  image: { width: 88, height: 88, borderRadius: 10 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  luxuryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.skyBlue },
  name: { fontSize: 15, fontWeight: '600', color: colors.paper },
  city: { fontSize: 12, color: colors.paper3 },
  chips: { flexDirection: 'row', gap: 6, marginTop: 2 },
  chip: { backgroundColor: colors.ink3, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2 },
  chipText: { fontSize: 10, fontWeight: '500', color: colors.paper2, letterSpacing: 0.3 },
});
