import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors } from '../../theme';
import { useVenues } from '../../supabase/hooks/useVenues';
import { useAuth } from '../../supabase/hooks/useAuth';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import { useWeather } from '../../hooks/useWeather';
import { useBookings } from '../../supabase/hooks/useBookings';
import { useFavouriteVenues } from '../../supabase/hooks/useFavourites';
import { deriveHomeTagline } from '../../utils/activityHeading';
import { weatherRecommendation } from '../../services/weather';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import NearbyVenueCard from '../../components/NearbyVenueCard';
import PopularVenueRow from '../../components/PopularVenueRow';
import { coachCategories, type CoachCategory } from '../../data/coachCategories';
import type { HomeStackParamList, TabParamList } from '../../navigation/types';

// Composite navigation type — lets us navigate inside HomeStack AND
// across tabs (to Coach with a prefilled prompt).
type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList>,
  BottomTabNavigationProp<TabParamList>
>;

const HERO_HEIGHT = 520;

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 22) return 'Good evening';
  return 'Good night';
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { credits } = useSubscription();
  const { venues, loading } = useVenues();
  const { weather } = useWeather();
  const { bookings: pastBookings }     = useBookings(false);
  const { bookings: upcomingBookings } = useBookings(true);
  const activityTagline = deriveHomeTagline(pastBookings, upcomingBookings);

  const { savedVenues, savedVenueIds, toggle } = useFavouriteVenues();

  // "Most popular now" = saved venues if the user has any, else fall back to curated list (max 4)
  const popularVenues = (savedVenues.length > 0 ? savedVenues : venues.slice(1)).slice(0, 4);

  const greeting = getGreeting();
  const fullName: string = user?.user_metadata?.full_name ?? user?.email ?? '';
  const firstName = fullName.split(' ')[0] || 'there';
  const initial = firstName.charAt(0).toUpperCase();

  const hero = venues[0];
  const nearby = venues.slice(1, 4);

  function openVenue(venueId: string) {
    navigation.navigate('VenueDetail', { venueId });
  }

  function openAccount() {
    navigation.navigate('Account');
  }

  function openCoach(prefilledMessage?: string) {
    navigation.navigate('Coach', {
      screen: 'CoachMain',
      params: prefilledMessage ? { prefilledMessage } : undefined,
    } as never);
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.heroContainer}>
        {hero ? (
          <Image source={{ uri: hero.imageUrl }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, { backgroundColor: colors.ink2 }]} />
        )}

        <LinearGradient
          colors={[
            'rgba(15,23,42,0.35)',
            'rgba(15,23,42,0.05)',
            'rgba(15,23,42,0.60)',
            'rgba(15,23,42,1.0)',
          ]}
          locations={[0, 0.3, 0.7, 1.0]}
          style={StyleSheet.absoluteFill}
        />

        <View style={[styles.heroInner, { paddingTop: insets.top + 12 }]}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <Text style={styles.wordmark}>
              <Text style={styles.wordmarkLife}>Life</Text>
              <Text style={styles.wordmarkPass}>Pass</Text>
            </Text>

            <View style={styles.topBarRight}>
              <TouchableOpacity onPress={openAccount} activeOpacity={0.7}>
                <CreditPill credits={credits} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.avatar} onPress={openAccount}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Editorial copy */}
          <View style={styles.editorial}>
            {/* Real weather row — replaces the old static tagline */}
            {weather && (
              <View style={styles.weatherRow}>
                <Ionicons name={weather.icon} size={13} color={colors.paper2} />
                <Text style={styles.weatherText}>
                  {weather.condition} · {weather.temperature}° · {weatherRecommendation(weather)}
                </Text>
              </View>
            )}

            <Text style={styles.greetingText}>
              {greeting}, <Text style={styles.greetingName}>{firstName}.</Text>
            </Text>
            {activityTagline ? (
              <Text style={styles.activityTagline}>{activityTagline}</Text>
            ) : null}

            {hero && (
              <View style={styles.pickupCard}>
                <Image source={{ uri: hero.imageUrl }} style={styles.pickupImage} />
                <View style={styles.pickupText}>
                  <Text style={styles.pickupKicker}>PICK UP WHERE YOU LEFT OFF</Text>
                  <Text style={styles.pickupVenue} numberOfLines={1}>
                    {hero.name}
                  </Text>
                  <Text style={styles.pickupSub} numberOfLines={1}>
                    {hero.city}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.bookButton}
                  onPress={() => openVenue(hero.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookButtonText}>
                    Book · {hero.creditCost} →
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Try something new — links to Coach AI.
          Lives directly under the hero so users see it first. Doesn't
          depend on venue data so it renders even while shelves are loading. */}
      <View style={styles.tryNewWrap}>
        <TryNewSection onPromptSelected={(prompt) => openCoach(prompt)} />
      </View>

      {/* Shelves */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.blue} />
        </View>
      ) : (
        <View style={styles.shelves}>
          {/* Near You */}
          {nearby.length > 0 && (
            <View style={styles.shelf}>
              <View style={styles.shelfHeader}>
                <View>
                  <Kicker text="Near You" />
                  <Text style={styles.shelfTitle}>Close by</Text>
                </View>
                <TouchableOpacity style={styles.allButton}>
                  <Text style={styles.allButtonText}>All →</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {nearby.map((venue) => (
                  <TouchableOpacity key={venue.id} activeOpacity={0.85} onPress={() => openVenue(venue.id)}>
                    <NearbyVenueCard venue={venue} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Most popular now */}
          {popularVenues.length > 0 && (
            <View style={styles.shelf}>
              <View style={styles.shelfHeader}>
                <View>
                  <Kicker text="Trending" />
                  <Text style={styles.shelfTitle}>Most popular now</Text>
                </View>
              </View>

              <View style={styles.curatedList}>
                {popularVenues.map((venue) => (
                  <TouchableOpacity
                    key={venue.id}
                    activeOpacity={0.85}
                    onPress={() => openVenue(venue.id)}
                  >
                    <PopularVenueRow
                      venue={venue}
                      isFavourited={savedVenueIds.includes(venue.id)}
                      onBook={() => openVenue(venue.id)}
                      onToggleFavourite={() => toggle(venue.id)}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      )}
    </ScrollView>
  );
}

// ─── Try-Something-New section ────────────────────────────────────────────────

// Quick-tap prompts shown in the AskCard. Each chip's `prompt` is what
// gets sent to Coach when tapped.
const ASK_CHIPS: { label: string; prompt: string }[] = [
  { label: '30 min sweat',       prompt: 'I have 30 minutes — what is a quick high-intensity workout?' },
  { label: 'After work',         prompt: "It's after 6pm. What's a good way to wind down nearby?" },
  { label: 'Lagoon enthusiast',  prompt: 'I love geothermal pools — suggest the best lagoon or thermal bath experience available on LifePass.' },
  { label: 'Visiting Reykjavík', prompt: "I'm a tourist visiting Reykjavík — what wellness experiences should I absolutely not miss?" },
];

const ASK_EXAMPLE = '"Find me a quiet 45-minute swim near work after 6pm"';

function TryNewSection({
  onPromptSelected,
}: {
  onPromptSelected: (prompt: string) => void;
}) {
  const [inputText, setInputText] = useState('');

  function handleSend() {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    onPromptSelected(text);
  }

  const canSend = inputText.trim().length > 0;

  return (
    <View style={trySection.container}>
      <Text style={trySection.heading}>
        Want to try{' '}
        <Text style={trySection.italic}>something new?</Text>
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={trySection.scrollContent}
      >
        {coachCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={trySection.card}
            onPress={() => onPromptSelected(cat.prompt)}
            activeOpacity={0.85}
          >
            <Image source={cat.image} style={trySection.cardImage} />
            <Text style={trySection.cardLabel} numberOfLines={2}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Ask card — free-text input + quick chips */}
      <View style={askCard.container}>
        {/* Input row */}
        <View style={askCard.inputRow}>
          <TextInput
            style={askCard.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder={ASK_EXAMPLE}
            placeholderTextColor="rgba(255,255,255,0.28)"
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            multiline={false}
          />
          <TouchableOpacity
            style={[askCard.sendBtn, canSend && askCard.sendBtnActive]}
            onPress={handleSend}
            activeOpacity={0.75}
            disabled={!canSend}
          >
            <Ionicons name="arrow-up" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick chips — single swipable row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={askCard.chips}
        >
          {ASK_CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip.label}
              style={askCard.chip}
              onPress={() => onPromptSelected(chip.prompt)}
              activeOpacity={0.8}
            >
              <Text style={askCard.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const trySection = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    gap: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  italic: {
    fontStyle: 'italic',
    color: colors.paper,
  },
  scrollContent: {
    gap: 14,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  card: {
    width: 110,
    alignItems: 'center',
    gap: 10,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 16,
    backgroundColor: colors.ink3,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.paper2,
    textAlign: 'center',
    lineHeight: 15,
  },
});

// ─── Ask-card (example query + tappable chips) ────────────────────────────────

const askCard = StyleSheet.create({
  container: {
    padding: 14,
    backgroundColor: colors.ink2,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.line2,
    gap: 12,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.paper,
    fontStyle: 'italic',
    letterSpacing: -0.2,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,216,240,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.25)',
  },
  sendBtnActive: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },
  chips: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.5)',
    backgroundColor: 'rgba(168,216,240,0.06)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.skyBlue,
    letterSpacing: -0.1,
  },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.ink },
  content: { flexGrow: 1 },
  heroContainer: { height: HERO_HEIGHT },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroInner: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wordmark: { fontSize: 22 },
  wordmarkLife: { color: colors.paper, fontWeight: '600' },
  wordmarkPass: { color: colors.paper, fontStyle: 'italic', fontWeight: '400' },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    // Frosted glass — matches the credit pill.
    backgroundColor: 'rgba(20, 33, 57, 0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  avatarInitial: { fontSize: 15, fontWeight: '600', color: colors.paper, fontStyle: 'italic' },
  editorial: { paddingBottom: 28, gap: 14 },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  weatherText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.paper2,
    letterSpacing: 1.0,
  },
  greetingText: {
    fontSize: 36, fontWeight: '400', color: colors.paper,
    letterSpacing: -1.2, lineHeight: 44,
  },
  greetingName: { color: colors.paper, fontStyle: 'italic' },
  activityTagline: {
    fontSize: 14,
    color: colors.paper2,
    letterSpacing: -0.1,
    marginTop: -4,
  },
  // Pickup card — glass section with thumbnail + venue info + book button.
  pickupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    backgroundColor: 'rgba(20, 33, 57, 0.55)',
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pickupImage: {
    width: 60, height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pickupText: { flex: 1, gap: 2 },
  pickupKicker: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.paper3,
    letterSpacing: 1.0,
    marginBottom: 2,
  },
  pickupVenue: {
    fontSize: 17,
    fontWeight: '500',
    fontStyle: 'italic',
    color: colors.paper,
    letterSpacing: -0.3,
  },
  pickupSub: {
    fontSize: 12,
    color: colors.paper2,
  },
  bookButton: {
    backgroundColor: 'rgba(0, 136, 255, 0.55)',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(168, 216, 240, 0.35)',
  },
  bookButtonText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60,
  },
  tryNewWrap: { paddingTop: 24, paddingBottom: 8 },
  shelves: { paddingTop: 12, gap: 32 },
  shelf: { gap: 14 },
  shelfHeader: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'space-between', paddingHorizontal: 24,
  },
  shelfTitle: {
    fontSize: 22, fontWeight: '400', color: colors.paper,
    letterSpacing: -0.4, marginTop: 4,
  },
  allButton: {
    backgroundColor: colors.ink2, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 0.5, borderColor: colors.line,
  },
  allButtonText: { fontSize: 12, fontWeight: '600', color: colors.paper2 },
  horizontalScroll: { paddingHorizontal: 20, gap: 12 },
  curatedList: { paddingHorizontal: 20, gap: 10 },
});
