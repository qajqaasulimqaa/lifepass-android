import { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WaveIcon from '../../components/WaveIcon';
import PricePill from '../../components/PricePill';
import { colors } from '../../theme';
import type { VenueCard } from '../../types/coach';

const H_PAD   = 16;   // left/right padding of the scroll view
const CARD_GAP = 10;  // gap between cards
const IMG_H    = 118; // fixed image height — total card ≈ 217px

type Props = {
  intro: string;
  venues: VenueCard[];
  onOtherIdeas: (searchQuery: string, category: string) => void;
  onBook: (venue: VenueCard) => void;
  searchQuery?: string;
};

type CardProps = {
  venue: VenueCard;
  width: number;
  onOtherIdeas: () => void;
  onBook: () => void;
};

function VenueCardItem({ venue, width, onOtherIdeas, onBook }: CardProps) {
  return (
    <TouchableOpacity
      style={[card.container, { width }]}
      onPress={onBook}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Open ${venue.name}`}
    >
      {/* Photo */}
      <View style={[card.imageWrap, { height: IMG_H }]}>
        <Image source={{ uri: venue.imageUrl }} style={card.image} resizeMode="cover" />
        <View style={card.categoryPill}>
          <Text style={card.categoryText} numberOfLines={1}>{venue.category.toUpperCase()}</Text>
        </View>
      </View>

      {/* Content */}
      <View style={card.body}>
        {/* "Included" / "from ISK X" — only when the card carries real
            venue pricing (credits are gone backend-side). */}
        {venue.inBundle !== undefined && (
          <View style={card.priceRow}>
            <PricePill
              venue={{
                inBundle: venue.inBundle,
                surchargePrice: venue.surchargePrice,
                resolvedSurchargePrice: venue.resolvedSurchargePrice,
                topupPrice: venue.topupPrice,
                daypassPrice: venue.daypassPrice,
                primaryCategory: venue.primaryCategory,
              }}
              compact
            />
          </View>
        )}

        {/* Name */}
        <View style={card.nameRow}>
          <Ionicons name="location-outline" size={11} color={colors.paper} />
          <Text style={card.name} numberOfLines={1}>{venue.name}</Text>
        </View>

        {/* Location */}
        <Text style={card.location} numberOfLines={1}>{venue.location}</Text>

        {/* Buttons */}
        <View style={card.btnRow}>
          <TouchableOpacity style={card.btn} onPress={onBook} activeOpacity={0.8}>
            <Text style={card.btnText}>Book it</Text>
          </TouchableOpacity>
          <TouchableOpacity style={card.btn} onPress={onOtherIdeas} activeOpacity={0.8}>
            <Text style={card.btnText}>Other Ideas</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function VenueCarouselMessage({
  intro,
  venues,
  onOtherIdeas,
  onBook,
  searchQuery,
}: Props) {
  const { width: screenWidth } = useWindowDimensions();

  // Exactly 2 cards fill the visible area
  const cardWidth   = Math.floor((screenWidth - H_PAD * 2 - CARD_GAP) / 2);
  const snapInterval = cardWidth + CARD_GAP;

  const [activeIndex, setActiveIndex] = useState(0);

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / snapInterval);
    setActiveIndex(Math.max(0, Math.min(idx, venues.length - 1)));
  }

  return (
    <View style={styles.root}>
      {/* Intro bubble */}
      <View style={styles.introRow}>
        <View style={styles.avatar}>
          <WaveIcon size={12} color={colors.skyBlue} />
        </View>
        <View style={styles.introBubble}>
          <Text style={styles.introText}>{intro}</Text>
        </View>
      </View>

      {/* Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {venues.map((venue) => (
          <VenueCardItem
            key={venue.id}
            venue={venue}
            width={cardWidth}
            onBook={() => onBook(venue)}
            onOtherIdeas={() => onOtherIdeas(searchQuery ?? venue.category, venue.category)}
          />
        ))}
      </ScrollView>

      {/* Dots */}
      {venues.length > 2 && (
        <View style={styles.dots}>
          {venues.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { gap: 10 },

  introRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: H_PAD,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(168,216,240,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  introBubble: {
    maxWidth: '82%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  introText: {
    fontSize: 13,
    color: colors.paper,
    lineHeight: 19,
  },

  row: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(168,216,240,0.22)',
  },
  dotActive: {
    width: 14,
    backgroundColor: colors.skyBlue,
  },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: colors.ink2,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: colors.line2,
  },

  imageWrap: { width: '100%' },
  image: { width: '100%', height: '100%' },

  categoryPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(8,14,30,0.72)',
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
    maxWidth: '80%',
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.skyBlue,
    letterSpacing: 0.5,
  },

  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 9,
    gap: 3,
  },

  priceRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.paper,
    letterSpacing: -0.2,
    flex: 1,
  },

  location: {
    fontSize: 10,
    color: colors.paper3,
    marginBottom: 5,
  },

  btnRow: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    flex: 1,
    backgroundColor: colors.ink3,
    borderRadius: 999,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: colors.line2,
  },
  btnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.paper,
  },
});
