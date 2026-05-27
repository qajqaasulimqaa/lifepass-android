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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from '../../components/MapView';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { useVenues } from '../../supabase/hooks/useVenues';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import { categoryFilters, matchesCategory } from '../../data/categories';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import type { Venue } from '../../types/venue';

type Nav = NativeStackNavigationProp<ExploreStackParamList>;
type Presentation = 'map' | 'list';
type ClassFilter = 'all' | 'basic' | 'luxury';

const CLASS_FILTERS: { id: ClassFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'basic', label: 'Basic' },
  { id: 'luxury', label: 'Luxury' },
];

const REYKJAVIK = {
  latitude: 64.1466,
  longitude: -21.9426,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

// Dark map style tuned to match the app's ink palette (#0F172A base)
const DARK_MAP_STYLE = [
  { elementType: 'geometry',            stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#6b7280' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0f172a' }] },
  { featureType: 'administrative',       elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'poi',                  elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'poi.park',             elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
  { featureType: 'poi.park',             elementType: 'labels.text.fill', stylers: [{ color: '#4b5563' }] },
  { featureType: 'road',                 elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road',                 elementType: 'geometry.stroke', stylers: [{ color: '#0f172a' }] },
  { featureType: 'road',                 elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway',         elementType: 'geometry', stylers: [{ color: '#253347' }] },
  { featureType: 'road.highway',         elementType: 'geometry.stroke', stylers: [{ color: '#1e2d3d' }] },
  { featureType: 'road.highway',         elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'transit',              elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'transit.station',      elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'water',                elementType: 'geometry', stylers: [{ color: '#0c1a2e' }] },
  { featureType: 'water',                elementType: 'labels.text.fill', stylers: [{ color: '#374151' }] },
  { featureType: 'water',                elementType: 'labels.text.stroke', stylers: [{ color: '#0c1a2e' }] },
];

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { venues, loading } = useVenues();
  const { credits } = useSubscription();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState<ClassFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [presentation, setPresentation] = useState<Presentation>('list');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  function openVenue(venueId: string) {
    navigation.navigate('VenueDetail', { venueId });
  }

  // Client-side filtering — venues list is small enough
  const filtered = useMemo(() => {
    return venues.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (classFilter === 'basic' && v.classification === 'luxury') return false;
      if (classFilter === 'luxury' && v.classification !== 'luxury') return false;
      if (categoryFilter && !matchesCategory(v.category, categoryFilter)) return false;
      return true;
    });
  }, [venues, search, classFilter, categoryFilter]);

  function classCount(f: ClassFilter) {
    return venues.filter((v) =>
      f === 'all' ? true : f === 'luxury' ? v.classification === 'luxury' : v.classification !== 'luxury'
    ).length;
  }

  function categoryCount(filterId: string) {
    return venues.filter((v) => matchesCategory(v.category, filterId)).length;
  }

  const selectedVenue = selectedVenueId
    ? venues.find((v) => v.id === selectedVenueId) ?? null
    : null;

  // Shared filter panel — rendered inline (list) or as overlay (map)
  const filterPanel = (
    <>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.wordmark}>
          <Text style={styles.wordmarkLife}>Life</Text>
          <Text style={styles.wordmarkPass}>Pass</Text>
        </Text>
        <View style={styles.topBarCenter}>
          <Kicker text="Explore" color={colors.paper2} />
          <Kicker text={`${filtered.length} venues`} color={colors.paper3} />
        </View>
        <CreditPill credits={credits} />
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
              {f.id === 'luxury' && <View style={styles.luxuryDot} />}
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.label}</Text>
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
            {venues.length}
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
    </>
  );

  if (presentation === 'map') {
    // Full-screen map — tiles bleed edge to edge behind the status bar.
    // The filter overlay sits on top and pushes its own content below the notch.
    return (
      <View style={styles.mapFull}>
        <MapView
          style={StyleSheet.absoluteFill}
          initialRegion={REYKJAVIK}
          customMapStyle={DARK_MAP_STYLE}
          userInterfaceStyle="dark"
        >
          {filtered
            .filter((v) => v.latitude != null && v.longitude != null)
            .map((venue) => (
              <Marker
                key={venue.id}
                coordinate={{ latitude: venue.latitude, longitude: venue.longitude }}
                onPress={() => setSelectedVenueId(venue.id)}
                tracksViewChanges={false}
              >
                <VenueMapMarker
                  imageUrl={venue.imageUrl}
                  isSelected={selectedVenueId === venue.id}
                />
              </Marker>
            ))}
        </MapView>

        {/* Filter panel floats over the map, padded below the notch */}
        <View style={[styles.mapOverlay, { paddingTop: insets.top }]}>
          {filterPanel}
        </View>

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
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading ? (
        <>
          {filterPanel}
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.blue} />
          </View>
        </>
      ) : (
        // LIST MODE — filter panel stacked above the list
        <>
          {filterPanel}
          <FlatList
            data={filtered}
            keyExtractor={(v) => v.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={venues.length > 0 ? <EditorialBanner heroVenue={venues.find(v => v.classification === 'luxury') ?? venues[0]} /> : null}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <TouchableOpacity activeOpacity={0.85} onPress={() => openVenue(item.id)}>
                <ExploreListRow venue={item} />
              </TouchableOpacity>
            )}
            ListFooterComponent={<View style={{ height: 120 }} />}
          />
        </>
      )}
    </View>
  );
}

// ─── Circular venue photo marker (mirrors iOS VenueMapMarker) ────────────────

function VenueMapMarker({ imageUrl, isSelected }: { imageUrl: string; isSelected: boolean }) {
  const outerSize = isSelected ? 48 : 40;
  const innerSize = isSelected ? 42 : 34;
  return (
    <View
      style={[
        markerStyles.outer,
        {
          width: outerSize,
          height: outerSize,
          borderRadius: outerSize / 2,
          backgroundColor: isSelected ? colors.blue : colors.paper,
        },
      ]}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: innerSize, height: innerSize, borderRadius: innerSize / 2 }}
      />
    </View>
  );
}

const markerStyles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
});

function EditorialBanner({ heroVenue }: { heroVenue: Venue }) {
  return (
    <View style={bannerStyles.container}>
      <Image source={{ uri: heroVenue.imageUrl }} style={bannerStyles.image} />
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 8,
    backgroundColor: colors.ink,
  },
  wordmark: { fontSize: 18 },
  wordmarkLife: { color: colors.paper, fontStyle: 'italic', fontWeight: '400' },
  wordmarkPass: { color: colors.paper, fontWeight: '700' },
  topBarCenter: { alignItems: 'center', gap: 2 },
  searchRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8 },
  searchField: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 44, paddingHorizontal: 14,
    backgroundColor: colors.ink2, borderRadius: 12,
    borderWidth: 0.5, borderColor: colors.line,
  },
  searchIcon: { fontSize: 13 },
  searchInput: { flex: 1, fontSize: 14, color: colors.paper },
  toggleButton: {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.ink2, borderRadius: 12,
    borderWidth: 0.5, borderColor: colors.line,
  },
  toggleIcon: { fontSize: 18, color: colors.paper },
  classChips: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 4 },
  categoryScroll: { height: 44, marginBottom: 4 },
  categoryChips: { paddingHorizontal: 20, gap: 8, alignItems: 'flex-start' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: colors.ink2, borderRadius: 999,
    borderWidth: 1, borderColor: colors.line,
  },
  chipSelected: { backgroundColor: colors.paper, borderColor: colors.paper },
  chipText: { fontSize: 12.5, fontWeight: '600', color: colors.paper2, letterSpacing: -0.1 },
  chipTextSelected: { color: colors.ink },
  chipCount: { fontSize: 11, color: colors.paper3, opacity: 0.8 },
  luxuryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.skyBlue },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Full-screen map root — no safe-area padding, tiles bleed to all edges
  mapFull: { flex: 1 },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  venuePopup: {
    position: 'absolute', bottom: 120, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, backgroundColor: colors.ink2,
    borderRadius: 14, borderWidth: 0.5, borderColor: colors.line2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  popupImage: { width: 56, height: 56, borderRadius: 8 },
  popupInfo: { flex: 1 },
  popupName: { fontSize: 14, fontWeight: '600', color: colors.paper },
  popupCity: { fontSize: 12, color: colors.paper3 },
  popupArrow: { fontSize: 14, color: colors.paper3 },
  list: { paddingTop: 6, paddingHorizontal: 20 },
});

const bannerStyles = StyleSheet.create({
  container: { height: 180, borderRadius: 16, overflow: 'hidden', marginBottom: 16, justifyContent: 'flex-end' },
  image: { ...StyleSheet.absoluteFillObject },
  copy: { padding: 16, gap: 4 },
  title: { fontSize: 22, fontWeight: '400', color: colors.paper, letterSpacing: -0.4 },
  italic: { fontStyle: 'italic' },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, backgroundColor: colors.ink2,
    borderRadius: 14, borderWidth: 0.5, borderColor: colors.line,
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
