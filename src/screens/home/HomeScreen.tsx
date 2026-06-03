import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
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
import { weatherRecommendation } from '../../services/weather';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import NearbyVenueCard from '../../components/NearbyVenueCard';
import CuratedVenueRow from '../../components/CuratedVenueRow';
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

  const greeting = getGreeting();
  const fullName: string = user?.user_metadata?.full_name ?? user?.email ?? '';
  const firstName = fullName.split(' ')[0] || 'there';
  const initial = firstName.charAt(0).toUpperCase();

  const hero = venues[0];
  const nearby = venues.slice(1, 4);
  const curated = venues.slice(4);

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

          {/* Curated */}
          {curated.length > 0 && (
            <View style={styles.shelf}>
              <View style={styles.shelfHeader}>
                <View>
                  <Kicker text={`Curated · ${greeting.toLowerCase()}`} />
                  <Text style={styles.shelfTitle}>Picked for you</Text>
                </View>
              </View>

              <View style={styles.curatedList}>
                {curated.map((venue) => (
                  <TouchableOpacity key={venue.id} activeOpacity={0.85} onPress={() => openVenue(venue.id)}>
                    <CuratedVenueRow venue={venue} />
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
  { label: 'Quiet evening', prompt: 'Suggest a quiet, relaxing evening for me.' },
  { label: 'Lagoon enthusiast', prompt: 'Suggest a quiet, relaxing evening for me.' },
 { label: '30 min sweat', prompt: 'I have 30 minutes — what is a quick high-intensity workout?' },
  { label: 'Try something new', prompt: 'I want to try something new — what do you suggest?' },
  { label: 'After work', prompt: "It's after 6pm. What's a good way to wind down nearby?" }
];

const ASK_EXAMPLE = '"Find me a quiet 45-minute swim near work after 6pm"';

function TryNewSection({
  onPromptSelected,
}: {
  onPromptSelected: (prompt: string) => void;
}) {
  return (
    <View style={trySection.container}>
      <Text style={trySection.heading}>
        Want to try{' '}
        <Text style={trySection.italic}>something new?</Text>
      </Text>
f
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

      {/* Ask AI CHAT Box */}
      <View style={askCard.container}>
        <Text style={askCard.example}>{ASK_EXAMPLE}</Text>
        <View style={askCard.chips}>
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
        </View>
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
    padding: 18,
    backgroundColor: colors.ink2,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: colors.line2,
    gap: 14,
    marginTop: 4,
  },
  example: {
    fontSize: 15,
    color: colors.paper,
    fontStyle: 'italic',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(168,216,240,0.5)',  // ~skyBlue at 50%
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
