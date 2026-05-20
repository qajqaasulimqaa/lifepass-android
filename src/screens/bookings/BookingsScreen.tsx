import { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { mockBookings } from '../../data/mockBookings';
import BrandedTopBar from '../../components/BrandedTopBar';
import CreditPill from '../../components/CreditPill';
import Kicker from '../../components/Kicker';
import EmptyState from '../../components/EmptyState';
import type { Booking } from '../../types/booking';

type Segment = 'upcoming' | 'past';

const STUB_CREDITS = 12;

function whenString(date: Date): string {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const days = Math.round((target - today) / dayMs);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  if (days === 0) return `Today · ${time}`;
  if (days === 1) return `Tomorrow · ${time}`;
  if (days === -1) return `Yesterday · ${time}`;

  const weekday = date.toLocaleDateString([], { weekday: 'short' });
  const day = date.getDate();
  return `${weekday} ${day} · ${time}`;
}

export default function BookingsScreen() {
  const [segment, setSegment] = useState<Segment>('upcoming');

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const upcoming = mockBookings.filter(
      (b) => b.status === 'confirmed' && b.bookingTime > now
    );
    const past = mockBookings.filter(
      (b) => b.status !== 'confirmed' || b.bookingTime <= now
    );
    return { upcoming, past };
  }, []);

  const list = segment === 'upcoming' ? upcoming : past;

  return (
    <View style={styles.container}>
      <BrandedTopBar title="Bookings" subtitle="Past & upcoming" credits={STUB_CREDITS} />

      {/* Segmented tabs */}
      <View style={styles.segmentBar}>
        <SegmentButton
          title="Upcoming"
          count={upcoming.length}
          active={segment === 'upcoming'}
          onPress={() => setSegment('upcoming')}
        />
        <SegmentButton
          title="Past"
          count={past.length}
          active={segment === 'past'}
          onPress={() => setSegment('past')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Spa booking CTA */}
        <TouchableOpacity style={styles.spaCta} activeOpacity={0.7}>
          <View style={styles.spaIcon}>
            <Ionicons name="water-outline" size={14} color={colors.blueMid} />
          </View>
          <View style={styles.spaText}>
            <Text style={styles.spaTitle}>Book a lagoon</Text>
            <Text style={styles.spaSub} numberOfLines={1}>
              Forest Lagoon, Vök Baths
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={11} color={colors.paper3} />
        </TouchableOpacity>

        {/* List */}
        {list.length === 0 ? (
          <EmptyState
            icon={segment === 'upcoming' ? 'calendar-outline' : 'time-outline'}
            message={
              segment === 'upcoming'
                ? 'No upcoming bookings.\nExplore venues to find your next class.'
                : 'Your past bookings will show up here.'
            }
          />
        ) : segment === 'upcoming' ? (
          <View style={styles.list}>
            {list.map((booking) => (
              <UpcomingCard key={booking.id} booking={booking} />
            ))}
          </View>
        ) : (
          <View>
            {list.map((booking, idx) => (
              <View key={booking.id}>
                <PastRow booking={booking} />
                {idx < list.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SegmentButton({
  title,
  count,
  active,
  onPress,
}: {
  title: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.segmentButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.segmentLabelRow}>
        <Text style={[styles.segmentTitle, active && styles.segmentTitleActive]}>{title}</Text>
        <Text style={styles.segmentCount}>{count}</Text>
      </View>
      <View style={[styles.segmentUnderline, active && styles.segmentUnderlineActive]} />
    </TouchableOpacity>
  );
}

function UpcomingCard({ booking }: { booking: Booking }) {
  return (
    <View style={cardStyles.card}>
      <Image source={{ uri: booking.venueImageUrl }} style={cardStyles.image} />
      <View style={cardStyles.info}>
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.name} numberOfLines={1}>{booking.venueName}</Text>
          {booking.isLuxury && (
            <View style={cardStyles.luxuryChip}>
              <Text style={cardStyles.luxuryChipText}>LUXURY</Text>
            </View>
          )}
        </View>
        <Text style={cardStyles.activity} numberOfLines={1}>{booking.activityName}</Text>
        <View style={cardStyles.metaRow}>
          <Text style={cardStyles.when}>{whenString(booking.bookingTime)}</Text>
          <View style={cardStyles.dot} />
          <View style={cardStyles.statusRow}>
            <View style={cardStyles.statusDot} />
            <Text style={cardStyles.status}>Confirmed</Text>
          </View>
        </View>
      </View>
      <CreditPill credits={booking.creditCost} compact />
    </View>
  );
}

function PastRow({ booking }: { booking: Booking }) {
  return (
    <View style={pastStyles.row}>
      <Image source={{ uri: booking.venueImageUrl }} style={pastStyles.image} />
      <View style={pastStyles.info}>
        <View style={pastStyles.nameRow}>
          <Text style={pastStyles.name} numberOfLines={1}>{booking.venueName}</Text>
          {booking.isLuxury && (
            <View style={pastStyles.luxuryChip}>
              <Text style={pastStyles.luxuryChipText}>LUXURY</Text>
            </View>
          )}
        </View>
        <Text style={pastStyles.detail} numberOfLines={1}>
          {booking.activityName} · {whenString(booking.bookingTime)}
        </Text>
      </View>
      <View style={pastStyles.creditCol}>
        <Text style={pastStyles.cost}>−{booking.creditCost} cr</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ink },

  segmentBar: {
    flexDirection: 'row',
    gap: 24,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.line,
  },
  segmentButton: { alignItems: 'flex-start' },
  segmentLabelRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, paddingBottom: 12 },
  segmentTitle: { fontSize: 14, fontWeight: '600', color: colors.paper3 },
  segmentTitleActive: { color: colors.paper },
  segmentCount: { fontSize: 12, color: colors.paper3 },
  segmentUnderline: { height: 2, alignSelf: 'stretch', backgroundColor: 'transparent' },
  segmentUnderlineActive: { backgroundColor: colors.blue },

  scroll: { paddingTop: 14, paddingBottom: 140, gap: 20 },
  spaCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginHorizontal: 20,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  spaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.blueWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaText: { flex: 1, gap: 2 },
  spaTitle: { fontSize: 14, fontWeight: '600', color: colors.paper },
  spaSub: { fontSize: 11, color: colors.paper3 },

  list: { paddingHorizontal: 20, gap: 10 },
  divider: { height: 0.5, backgroundColor: colors.line, marginHorizontal: 20 },
});

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.ink2,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.line,
  },
  image: { width: 64, height: 64, borderRadius: 10 },
  info: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: colors.paper, flexShrink: 1 },
  luxuryChip: { backgroundColor: 'rgba(168,216,240,0.14)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  luxuryChipText: { fontSize: 9, fontWeight: '700', color: colors.skyBlue, letterSpacing: 0.6 },
  activity: { fontSize: 12, color: colors.paper3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  when: { fontSize: 12, fontWeight: '500', color: colors.paper2 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.paper4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.moss },
  status: { fontSize: 11, fontWeight: '600', color: colors.moss },
});

const pastStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  image: { width: 44, height: 44, borderRadius: 8, opacity: 0.7 },
  info: { flex: 1, gap: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13.5, fontWeight: '500', color: colors.paper2, flexShrink: 1 },
  luxuryChip: { backgroundColor: 'rgba(168,216,240,0.14)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  luxuryChipText: { fontSize: 9, fontWeight: '700', color: colors.skyBlue, letterSpacing: 0.6 },
  detail: { fontSize: 11, color: colors.paper3 },
  creditCol: { alignItems: 'flex-end' },
  cost: { fontSize: 11, color: colors.paper3 },
});
