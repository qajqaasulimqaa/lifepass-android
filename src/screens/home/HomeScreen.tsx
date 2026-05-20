import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme';
import { mockVenues } from '../../data/mockVenues';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import NearbyVenueCard from '../../components/NearbyVenueCard';
import CuratedVenueRow from '../../components/CuratedVenueRow';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

const HERO_HEIGHT = 520;
const STUB_CREDITS = 12;
const STUB_FIRST_NAME = 'Kaja';

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

  const hero = mockVenues[0];
  const nearby = mockVenues.slice(1, 4);
  const curated = mockVenues.slice(4);
  const greeting = getGreeting();

  function openVenue(venueId: string) {
    navigation.navigate('VenueDetail', { venueId });
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.heroContainer}>
        <Image source={{ uri: hero.imageUrl }} style={styles.heroImage} />

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
            <TouchableOpacity style={styles.avatar}>
              <Text style={styles.avatarInitial}>
                {STUB_FIRST_NAME.charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>

            <Kicker text="Today · Reykjavík" color={colors.paper2} />

            <CreditPill credits={STUB_CREDITS} />
          </View>

          {/* Editorial copy at bottom of hero */}
          <View style={styles.editorial}>
            <Kicker text={greeting} color={colors.paper2} />

            <Text style={styles.greetingText}>
              {greeting},{' '}
              <Text style={styles.greetingName}>{STUB_FIRST_NAME}.</Text>
              {'\n'}
              <Text style={styles.greetingTagline}>The sky is clearing.</Text>
            </Text>

            <View style={styles.venueRow}>
              <View>
                <Kicker text="Tonight's pick" color={colors.skyBlue} />
                <Text style={styles.venueName}>{hero.name}</Text>
                <Text style={styles.venueCity}>{hero.city}</Text>
              </View>

              <TouchableOpacity style={styles.bookButton} onPress={() => openVenue(hero.id)}>
                <Text style={styles.bookButtonText}>
                  Book · {hero.creditCost} cr →
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Shelves */}
      <View style={styles.shelves}>
        {/* Near You */}
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

        {/* Curated */}
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

        <View style={{ height: 120 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flexGrow: 1,
  },
  heroContainer: {
    height: HERO_HEIGHT,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
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
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.ink3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line2,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.paper,
  },
  editorial: {
    paddingBottom: 28,
    gap: 14,
  },
  greetingText: {
    fontSize: 36,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -1.2,
    lineHeight: 44,
  },
  greetingName: {
    color: colors.paper,
  },
  greetingTagline: {
    color: colors.paper2,
    fontStyle: 'italic',
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  venueName: {
    fontSize: 24,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  venueCity: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.paper2,
  },
  bookButton: {
    backgroundColor: colors.paper,
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  shelves: {
    paddingTop: 12,
    gap: 32,
  },
  shelf: {
    gap: 14,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  shelfTitle: {
    fontSize: 22,
    fontWeight: '400',
    color: colors.paper,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  allButton: {
    backgroundColor: colors.ink2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  allButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.paper2,
  },
  horizontalScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  curatedList: {
    paddingHorizontal: 20,
    gap: 10,
  },
});
