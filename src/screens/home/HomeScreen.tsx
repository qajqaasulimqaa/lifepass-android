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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../../theme';
import { useVenues } from '../../supabase/hooks/useVenues';
import { useAuth } from '../../supabase/hooks/useAuth';
import { useSubscription } from '../../supabase/hooks/useSubscription';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import NearbyVenueCard from '../../components/NearbyVenueCard';
import CuratedVenueRow from '../../components/CuratedVenueRow';
import type { HomeStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

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
            <TouchableOpacity style={styles.avatar} onPress={openAccount}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </TouchableOpacity>

            <Kicker text="Today · Reykjavík" color={colors.paper2} />

            <TouchableOpacity onPress={openAccount} activeOpacity={0.7}>
              <CreditPill credits={credits} />
            </TouchableOpacity>
          </View>

          {/* Editorial copy */}
          <View style={styles.editorial}>
            <Kicker text={greeting} color={colors.paper2} />

            <Text style={styles.greetingText}>
              {greeting},{' '}
              <Text style={styles.greetingName}>{firstName}.</Text>
              {'\n'}
              <Text style={styles.greetingTagline}>The sky is clearing.</Text>
            </Text>

            {hero && (
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
            )}
          </View>
        </View>
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
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.ink3,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.line2,
  },
  avatarInitial: { fontSize: 16, fontWeight: '600', color: colors.paper },
  editorial: { paddingBottom: 28, gap: 14 },
  greetingText: {
    fontSize: 36, fontWeight: '400', color: colors.paper,
    letterSpacing: -1.2, lineHeight: 44,
  },
  greetingName: { color: colors.paper },
  greetingTagline: { color: colors.paper2, fontStyle: 'italic' },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  venueName: {
    fontSize: 24, fontWeight: '400', color: colors.paper,
    letterSpacing: -0.6, marginTop: 6,
  },
  venueCity: { fontSize: 16, fontStyle: 'italic', color: colors.paper2 },
  bookButton: {
    backgroundColor: colors.paper, borderRadius: 999,
    paddingHorizontal: 18, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },
  bookButtonText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  loadingContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60,
  },
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
