import { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { colors } from '../../theme';
import WaveIcon from '../../components/WaveIcon';
import {
  mockCoachMessages,
  recentChats,
  selectChips,
} from '../../data/mockCoach';
import { deriveActivityTags } from '../../coach/deriveTags';
import { sendCoachMessage } from '../../supabase/services/coach';
import { useBookings } from '../../supabase/hooks/useBookings';
import { useFavouriteVenues } from '../../supabase/hooks/useFavourites';
import type { ChatMessage, VenueCard } from '../../types/coach';
import type { CoachStackParamList } from '../../navigation/types';
import {
  detectVenueCategory,
  VENUE_QUESTIONS,
} from '../../data/coachQuestions';
import { coachCategories } from '../../data/coachCategories';
import { fetchVenuesByCoachQuery } from '../../supabase/services/venues';
import ChatDrawer from './ChatDrawer';
import SuggestionChips from './SuggestionChips';
import VenueCarouselMessage from './VenueCarouselMessage';
import QuestionBubbleMessage from './QuestionBubbleMessage';

let idCounter = 100;
const nextId = () => String(++idCounter);

const CONTEXT_HEADING = 'Gym yesterday.\nToday is relaxing day.';

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<CoachStackParamList, 'CoachMain'>>();
  const prefilledMessage = route.params?.prefilledMessage;

  const { bookings: pastBookings } = useBookings(false);
  const { savedVenues } = useFavouriteVenues();

  const [messages, setMessages] = useState<ChatMessage[]>(mockCoachMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const autoSentRef = useRef(false);

  // Q&A flow state — tracks which category and step we're on
  const [qaFlow, setQaFlow] = useState<{
    category: string;
    step: number;
    answers: string[];
  } | null>(null);

  // Request location permission on mount and cache coordinates for "Close by" chip
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  // Hide category strip and remove excess bottom padding while keyboard is open
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Derive activity tags from real bookings + favourited venues, then pick
  // the 4 most-relevant suggestion chips from the bank.
  const userTags = useMemo(
    () => deriveActivityTags({ bookings: pastBookings, favourites: savedVenues }),
    [pastBookings, savedVenues],
  );
  const chips = useMemo(() => selectChips(userTags), [userTags]);

  const hasStartedChat = messages.some((m) => m.role === 'user');

  // ── Core AI call (bypasses Q&A detection) ────────────────────────────────
  async function callAI(outgoing: ChatMessage[]) {
    setIsTyping(true);
    try {
      // Strip Q&A messages from history so the AI only sees real conversation
      const clean = outgoing.filter((m) => !m.questionOptions);
      const reply = await sendCoachMessage(clean);
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'assistant',
          text: reply.text,
          venueCards: reply.venueCards,
          searchQuery: reply.searchQuery,
          createdAt: new Date(),
        },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Coach is unavailable right now.';
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'assistant',
          text: `Sorry — ${err}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  // ── Start Q&A flow when a venue category is detected ─────────────────────
  function startQAFlow(userText: string, category: string) {
    const questions = VENUE_QUESTIONS[category];
    const q = questions[0];
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: userText, createdAt: new Date() };
    const questionMsg: ChatMessage = {
      id: nextId(),
      role: 'assistant',
      text: q.text,
      questionOptions: q.options,
      createdAt: new Date(),
    };
    setMessages((m) => [...m, userMsg, questionMsg]);
    setQaFlow({ category, step: 0, answers: [] });
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  // ── Handle chip selection inside a Q&A bubble ─────────────────────────────
  async function handleOptionSelect(msgId: string, value: string, label: string) {
    if (!qaFlow) return;

    // Mark the question message as answered
    setMessages((m) =>
      m.map((msg) =>
        msg.id === msgId
          ? { ...msg, questionAnswered: true, selectedAnswer: label }
          : msg,
      ),
    );

    const newAnswers = [...qaFlow.answers, value];
    const questions = VENUE_QUESTIONS[qaFlow.category];
    const nextStep = qaFlow.step + 1;

    // Add user bubble showing what was selected
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: label, createdAt: new Date() };

    if (nextStep < questions.length) {
      // Show next question
      const nextQ = questions[nextStep];
      const questionMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        text: nextQ.text,
        questionOptions: nextQ.options,
        createdAt: new Date(),
      };
      setMessages((m) => [...m, userMsg, questionMsg]);
      setQaFlow({ ...qaFlow, step: nextStep, answers: newAnswers });
    } else {
      // All 3 questions answered → query real DB venues
      const { category, answers: prevAnswers } = qaFlow;
      const allAnswers = [...prevAnswers, value];
      const locationAnswer = allAnswers[1] ?? ''; // Q2 is always location

      setMessages((m) => [...m, userMsg]);
      setQaFlow(null);
      setIsTyping(true);

      try {
        const venues = await fetchVenuesByCoachQuery(category, locationAnswer, userCoords ?? undefined);
        const venueCards = venues.map((v) => ({
          id: v.id,
          name: v.name,
          location: [v.city, v.address].filter(Boolean).join(' · '),
          description: v.description || '',
          imageUrl: v.imageUrl,
          creditCost: v.creditCost,
          category: v.category?.[0] ?? category,
        }));

        const intro = venueCards.length > 0
          ? `Found ${venueCards.length} ${category} option${venueCards.length > 1 ? 's' : ''} for you:`
          : `No exact matches found — here are all our ${category} venues:`;

        // If DB returned nothing, fall back to a wider search
        if (venueCards.length === 0) {
          const fallback = await fetchVenuesByCoachQuery(category, 'anywhere');
          const fallbackCards = fallback.map((v) => ({
            id: v.id,
            name: v.name,
            location: [v.city, v.address].filter(Boolean).join(' · '),
            description: v.description || '',
            imageUrl: v.imageUrl,
            creditCost: v.creditCost,
            category: v.category?.[0] ?? category,
          }));
          setMessages((m) => [...m, {
            id: nextId(), role: 'assistant',
            text: fallbackCards.length > 0
              ? `No exact match for your filters — here's what we have for ${category}:`
              : `We don't have any ${category} venues listed yet. Check back soon!`,
            venueCards: fallbackCards.length > 0 ? fallbackCards : undefined,
            createdAt: new Date(),
          }]);
        } else {
          setMessages((m) => [...m, {
            id: nextId(), role: 'assistant',
            text: intro,
            venueCards,
            createdAt: new Date(),
          }]);
        }
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      } catch (e) {
        setMessages((m) => [...m, {
          id: nextId(), role: 'assistant',
          text: 'Sorry — I couldn\'t load venues right now. Please try again.',
          createdAt: new Date(),
        }]);
      } finally {
        setIsTyping(false);
      }
    }

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  // ── Main send — detects venue searches, otherwise sends to AI ────────────
  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;
    setInput('');

    // If mid-flow and user types manually, treat as answer to current question
    if (qaFlow) {
      const currentQMsg = [...messages].reverse().find((m) => m.questionOptions && !m.questionAnswered);
      if (currentQMsg) {
        handleOptionSelect(currentQMsg.id, trimmed, trimmed);
        return;
      }
    }

    // Detect venue search → start Q&A
    const category = detectVenueCategory(trimmed);
    if (category) {
      startQAFlow(trimmed, category);
      return;
    }

    // Regular message → straight to AI
    const userMsg: ChatMessage = { id: nextId(), role: 'user', text: trimmed, createdAt: new Date() };
    setMessages((m) => [...m, userMsg]);
    callAI([...messages, userMsg]);
  }

  function handleOtherIdeas(searchQuery: string, category: string) {
    send(`Show me other ${searchQuery || category} options in Iceland`);
  }

  function handleBook(venue: VenueCard) {
    // Navigate to the venue detail screen via the Explore stack
    navigation.getParent()?.navigate('Explore', {
      screen: 'VenueDetail',
      params: { venueId: venue.id },
    });
  }

  // Auto-send a message passed via navigation params (e.g. when the user
  // tapped a category card on Home). Fires once on mount only.
  useEffect(() => {
    if (!prefilledMessage || autoSentRef.current) return;
    autoSentRef.current = true;
    send(prefilledMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefilledMessage]);

  function resetChat() {
    setMessages(mockCoachMessages);
    setInput('');
    setIsTyping(false);
    setQaFlow(null);
  }

  // Render the category strip (reused in both chat and empty states)
  const CategoryStrip = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      {coachCategories.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={styles.categoryCard}
          onPress={() => send(cat.prompt)}
          activeOpacity={0.85}
        >
          <Image source={cat.image} style={styles.categoryImage} />
          <Text style={styles.categoryLabel} numberOfLines={2}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    // KAV is the outermost element so it owns the full-screen height and can
    // correctly push content above the keyboard on both platforms.
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ImageBackground
        source={require('../../../assets/bg-chat.jpg')}
        style={styles.bg}
        resizeMode="cover"
      >
        <View style={styles.overlayTop} />
        <View style={styles.overlayBottom} />

        {/* ── Top bar ── */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={styles.burgerBtn}
            onPress={() => setDrawerOpen(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu-outline" size={26} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={styles.screenTitle}>AI Assistant</Text>
          <View style={{ width: 42 }} />
        </View>

        {/* ── Content ── */}
        <View style={{ flex: 1 }}>
          {hasStartedChat ? (
            <ScrollView
              ref={scrollRef}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((m) =>
                m.venueCards && m.venueCards.length > 0 ? (
                  <VenueCarouselMessage
                    key={m.id}
                    intro={m.text}
                    venues={m.venueCards}
                    searchQuery={m.searchQuery}
                    onOtherIdeas={handleOtherIdeas}
                    onBook={handleBook}
                  />
                ) : m.questionOptions && m.questionOptions.length > 0 ? (
                  <QuestionBubbleMessage
                    key={m.id}
                    question={m.text}
                    options={m.questionOptions}
                    answered={!!m.questionAnswered}
                    selectedAnswer={m.selectedAnswer}
                    onSelect={(value, label) => handleOptionSelect(m.id, value, label)}
                  />
                ) : (
                  <MessageBubble key={m.id} message={m} />
                )
              )}
              {isTyping && <TypingIndicator />}
            </ScrollView>
          ) : (
            <>
              {/* Empty state: heading centred */}
              <View style={styles.headingContainer}>
                <Text style={styles.heading}>{CONTEXT_HEADING}</Text>
              </View>
              <SuggestionChips chips={chips} onSelect={send} />
            </>
          )}

          {/* Category strip — hidden while keyboard is open */}
          {!keyboardVisible && CategoryStrip}

          {/* ── Input bar ── */}
          <View style={[styles.inputBar, { paddingBottom: keyboardVisible ? insets.bottom + 8 : insets.bottom + 84 }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Feeling stuck? Let me help!"
              placeholderTextColor="rgba(255,255,255,0.40)"
              style={styles.input}
              multiline
              onSubmitEditing={() => send(input)}
              blurOnSubmit={false}
              selectionColor={colors.blue}
              underlineColorAndroid="transparent"
            />
            {input.trim() ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={() => send(input)}
                disabled={isTyping}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <View style={styles.micContainer}>
                <Ionicons name="mic-outline" size={22} color="rgba(255,255,255,0.55)" />
              </View>
            )}
          </View>
        </View>
      </ImageBackground>

      <ChatDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNewChat={resetChat}
        recentChats={recentChats}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[bubble.row, isUser && bubble.rowUser]}>
      {!isUser && (
        <View style={bubble.avatar}>
          <WaveIcon size={13} color={colors.skyBlue} />
        </View>
      )}
      <View style={[bubble.wrap, isUser ? bubble.wrapUser : bubble.wrapAssistant]}>
        <Text style={[bubble.text, isUser && bubble.textUser]}>{message.text}</Text>
      </View>
    </View>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <View style={bubble.row}>
      <View style={bubble.avatar}>
        <WaveIcon size={13} color={colors.skyBlue} />
      </View>
      <View style={[bubble.wrap, bubble.wrapAssistant, bubble.typing]}>
        <View style={bubble.dot} />
        <View style={[bubble.dot, { opacity: 0.6 }]} />
        <View style={[bubble.dot, { opacity: 0.3 }]} />
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  bg: { flex: 1 },

  overlayTop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,14,30,0.42)',
    bottom: '40%',
  },
  overlayBottom: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    top: '50%',
    backgroundColor: 'rgba(8,14,30,0.78)',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  burgerBtn: {
    width: 42, height: 42,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
  },

  headingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  heading: {
    fontSize: 36,
    fontWeight: '400',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 46,
    letterSpacing: -0.5,
  },

  chatList: { flex: 1 },
  chatListContent: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 20, gap: 14 },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    paddingHorizontal: 18,
    paddingVertical: 11,
    backgroundColor: 'rgba(10,20,45,0.88)',
    borderRadius: 26,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.22)',
    fontSize: 15,
    color: '#FFFFFF',
  },
  sendButton: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micContainer: {
    width: 42, height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Category image strip — pinned just above input bar
  categoryScroll: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  categoryCard: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  categoryImage: {
    width: 62,
    height: 62,
    borderRadius: 12,
    backgroundColor: colors.ink3,
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.paper2,
    textAlign: 'center',
    lineHeight: 13,
  },
});

const bubble = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  avatar: {
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(168,216,240,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  wrap: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  wrapAssistant: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderTopLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.13)',
  },
  wrapUser: {
    backgroundColor: colors.blue,
    borderTopRightRadius: 4,
  },
  text: { fontSize: 14, color: colors.paper, lineHeight: 20 },
  textUser: { color: '#FFFFFF' },
  typing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 14,
  },
  dot: {
    width: 6, height: 6,
    borderRadius: 3,
    backgroundColor: colors.paper2,
  },
});
