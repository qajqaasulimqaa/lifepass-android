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
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExploreStackParamList } from '../../navigation/types';
import { colors } from '../../theme';
import { useVenues } from '../../supabase/hooks/useVenues';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import {
  categoryFilters,
  matchesCategory,
  matchesCreditRange,
  GYM_GROUP_IDS,
  MARTIAL_ARTS_GROUP_IDS,
  WELLNESS_GROUP_IDS,
  SPORTS_GROUP_IDS,
  PILATES_YOGA_GROUP_IDS,
  ALL_GROUP_IDS,
  CREDIT_FILTERS,
  type CreditRange,
} from '../../data/categories';
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
  const [creditFilter, setCreditFilter] = useState<CreditRange>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [gymGroupOpen, setGymGroupOpen] = useState(false);
  const [martialArtsOpen, setMartialArtsOpen] = useState(false);
  const [wellnessOpen, setWellnessOpen] = useState(false);
  const [sportsOpen, setSportsOpen] = useState(false);
  const [pilatesYogaOpen, setPilatesYogaOpen] = useState(false);
  const [presentation, setPresentation] = useState<Presentation>('list');
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  function openVenue(venueId: string) {
    navigation.navigate('VenueDetail', { venueId });
  }

  function closeAllGroups() {
    setGymGroupOpen(false);
    setMartialArtsOpen(false);
    setWellnessOpen(false);
    setSportsOpen(false);
    setPilatesYogaOpen(false);
  }

  // Client-side filtering — venues list is small enough
  const filtered = useMemo(() => {
    return venues.filter((v) => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (classFilter === 'basic' && v.classification === 'luxury') return false;
      if (classFilter === 'luxury' && v.classification !== 'luxury') return false;
      if (!matchesCreditRange(v.creditCost, creditFilter)) return false;
      if (categoryFilter && !matchesCategory(v.category, categoryFilter)) return false;
      return true;
    });
  }, [venues, search, classFilter, creditFilter, categoryFilter]);

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
          <Ionicons
            name={presentation === 'map' ? 'list-outline' : 'map-outline'}
            size={20}
            color={colors.paper}
          />
        </TouchableOpacity>
      </View>

      {/* Row 1 — Class: All / Basic / Luxury */}
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

      {/* Row 2 — Credits: All / 1-2 / 3-5 / 6+ */}
      <View style={styles.classChips}>
        {CREDIT_FILTERS.map((f) => {
          const selected = creditFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => setCreditFilter(f.id)}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Row 3 — Category group dropdowns + flat chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryChips}
        style={styles.categoryScroll}
      >
        {/* All */}
        <TouchableOpacity
          style={[styles.chip, !categoryFilter && styles.chipSelected]}
          onPress={() => { setCategoryFilter(null); closeAllGroups(); }}
        >
          <Text style={[styles.chipText, !categoryFilter && styles.chipTextSelected]}>All</Text>
          <Text style={[styles.chipCount, !categoryFilter && styles.chipTextSelected]}>
            {venues.length}
          </Text>
        </TouchableOpacity>

        {/* Gym & Fitness */}
        {(() => {
          const active = categoryFilter !== null && GYM_GROUP_IDS.includes(categoryFilter);
          return (
            <TouchableOpacity
              style={[styles.chip, (gymGroupOpen || active) && styles.chipSelected]}
              onPress={() => {
                const next = !gymGroupOpen;
                closeAllGroups();
                setGymGroupOpen(next);
                if (active) setCategoryFilter(null);
              }}
            >
              <Text style={[styles.chipText, (gymGroupOpen || active) && styles.chipTextSelected]}>
                Gym & Fitness
              </Text>
              <Text style={[styles.chipText, (gymGroupOpen || active) && styles.chipTextSelected]}>
                {gymGroupOpen ? ' ▲' : ' ▼'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Martial Arts */}
        {(() => {
          const active = categoryFilter !== null && MARTIAL_ARTS_GROUP_IDS.includes(categoryFilter);
          return (
            <TouchableOpacity
              style={[styles.chip, (martialArtsOpen || active) && styles.chipSelected]}
              onPress={() => {
                const next = !martialArtsOpen;
                closeAllGroups();
                setMartialArtsOpen(next);
                if (active) setCategoryFilter(null);
              }}
            >
              <Text style={[styles.chipText, (martialArtsOpen || active) && styles.chipTextSelected]}>
                Martial Arts
              </Text>
              <Text style={[styles.chipText, (martialArtsOpen || active) && styles.chipTextSelected]}>
                {martialArtsOpen ? ' ▲' : ' ▼'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Wellness */}
        {(() => {
          const active = categoryFilter !== null && WELLNESS_GROUP_IDS.includes(categoryFilter);
          return (
            <TouchableOpacity
              style={[styles.chip, (wellnessOpen || active) && styles.chipSelected]}
              onPress={() => {
                const next = !wellnessOpen;
                closeAllGroups();
                setWellnessOpen(next);
                if (active) setCategoryFilter(null);
              }}
            >
              <Text style={[styles.chipText, (wellnessOpen || active) && styles.chipTextSelected]}>
                Wellness
              </Text>
              <Text style={[styles.chipText, (wellnessOpen || active) && styles.chipTextSelected]}>
                {wellnessOpen ? ' ▲' : ' ▼'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Sports */}
        {(() => {
          const active = categoryFilter !== null && SPORTS_GROUP_IDS.includes(categoryFilter);
          return (
            <TouchableOpacity
              style={[styles.chip, (sportsOpen || active) && styles.chipSelected]}
              onPress={() => {
                const next = !sportsOpen;
                closeAllGroups();
                setSportsOpen(next);
                if (active) setCategoryFilter(null);
              }}
            >
              <Text style={[styles.chipText, (sportsOpen || active) && styles.chipTextSelected]}>
                Sports
              </Text>
              <Text style={[styles.chipText, (sportsOpen || active) && styles.chipTextSelected]}>
                {sportsOpen ? ' ▲' : ' ▼'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Pilates & Yoga */}
        {(() => {
          const active = categoryFilter !== null && PILATES_YOGA_GROUP_IDS.includes(categoryFilter);
          return (
            <TouchableOpacity
              style={[styles.chip, (pilatesYogaOpen || active) && styles.chipSelected]}
              onPress={() => {
                const next = !pilatesYogaOpen;
                closeAllGroups();
                setPilatesYogaOpen(next);
                if (active) setCategoryFilter(null);
              }}
            >
              <Text style={[styles.chipText, (pilatesYogaOpen || active) && styles.chipTextSelected]}>
                Pilates & Yoga
              </Text>
              <Text style={[styles.chipText, (pilatesYogaOpen || active) && styles.chipTextSelected]}>
                {pilatesYogaOpen ? ' ▲' : ' ▼'}
              </Text>
            </TouchableOpacity>
          );
        })()}

        {/* Remaining ungrouped categories */}
        {categoryFilters
          .filter((f) => !ALL_GROUP_IDS.includes(f.id))
          .map((f) => {
            const selected = categoryFilter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => { setCategoryFilter(selected ? null : f.id); closeAllGroups(); }}
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

      {/* Sub-row — Gym & Fitness */}
      {gymGroupOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips} style={styles.gymSubRow}>
          {categoryFilters.filter((f) => GYM_GROUP_IDS.includes(f.id)).map((f) => {
            const selected = categoryFilter === f.id;
            return (
              <TouchableOpacity key={f.id}
                style={[styles.chip, styles.chipSub, selected && styles.chipSubSelected]}
                onPress={() => setCategoryFilter(selected ? null : f.id)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.displayName}</Text>
                <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>{categoryCount(f.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sub-row — Martial Arts */}
      {martialArtsOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips} style={styles.gymSubRow}>
          {categoryFilters.filter((f) => MARTIAL_ARTS_GROUP_IDS.includes(f.id)).map((f) => {
            const selected = categoryFilter === f.id;
            return (
              <TouchableOpacity key={f.id}
                style={[styles.chip, styles.chipSub, selected && styles.chipSubSelected]}
                onPress={() => setCategoryFilter(selected ? null : f.id)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.displayName}</Text>
                <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>{categoryCount(f.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sub-row — Wellness */}
      {wellnessOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips} style={styles.gymSubRow}>
          {categoryFilters.filter((f) => WELLNESS_GROUP_IDS.includes(f.id)).map((f) => {
            const selected = categoryFilter === f.id;
            return (
              <TouchableOpacity key={f.id}
                style={[styles.chip, styles.chipSub, selected && styles.chipSubSelected]}
                onPress={() => setCategoryFilter(selected ? null : f.id)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.displayName}</Text>
                <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>{categoryCount(f.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sub-row — Sports */}
      {sportsOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips} style={styles.gymSubRow}>
          {categoryFilters.filter((f) => SPORTS_GROUP_IDS.includes(f.id)).map((f) => {
            const selected = categoryFilter === f.id;
            return (
              <TouchableOpacity key={f.id}
                style={[styles.chip, styles.chipSub, selected && styles.chipSubSelected]}
                onPress={() => setCategoryFilter(selected ? null : f.id)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.displayName}</Text>
                <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>{categoryCount(f.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Sub-row — Pilates & Yoga */}
      {pilatesYogaOpen && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChips} style={styles.gymSubRow}>
          {categoryFilters.filter((f) => PILATES_YOGA_GROUP_IDS.includes(f.id)).map((f) => {
            const selected = categoryFilter === f.id;
            return (
              <TouchableOpacity key={f.id}
                style={[styles.chip, styles.chipSub, selected && styles.chipSubSelected]}
                onPress={() => setCategoryFilter(selected ? null : f.id)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{f.displayName}</Text>
                <Text style={[styles.chipCount, selected && styles.chipTextSelected]}>{categoryCount(f.id)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
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
            ListHeaderComponent={<EditorialBanner />}
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

function EditorialBanner() {
  return (
    <View style={bannerStyles.container}>
      <Video
        source={require('../../../assets/hero-video-compressed.mp4')}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        shouldPlay
        isLooping
        isMuted
        useNativeControls={false}
      />
      <LinearGradient
        colors={['rgba(15,23,42,0.05)', 'rgba(15,23,42,0.85)']}
        locations={[0.3, 1.0]}
        style={StyleSheet.absoluteFill}
      />
      <View style={bannerStyles.copy}>
        <Kicker text="Feel Great Everyday" color={colors.skyBlue} />
        <Text style={bannerStyles.title}>
          Gym, Spa, Pool, Lagoon-{' '}
          <Text style={bannerStyles.italic}> all at one pass</Text>
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
  gymSubRow: { height: 44, marginBottom: 4 },
  chipSub: {},
  chipSubSelected: { backgroundColor: colors.blue, borderColor: colors.blue },
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
