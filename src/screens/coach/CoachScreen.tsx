import { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import type { ChatMessage } from '../../types/coach';
import ChatDrawer from './ChatDrawer';
import SuggestionChips from './SuggestionChips';

let idCounter = 100;
const nextId = () => String(++idCounter);

const CONTEXT_HEADING = 'Gym yesterday.\nToday is relaxing day.';

export default function CoachScreen() {
  const insets = useSafeAreaInsets();
  const { bookings: pastBookings } = useBookings(false);
  const { savedVenues } = useFavouriteVenues();

  const [messages, setMessages] = useState<ChatMessage[]>(mockCoachMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  // Derive activity tags from real bookings + favourited venues, then pick
  // the 4 most-relevant suggestion chips from the bank.
  const userTags = useMemo(
    () => deriveActivityTags({ bookings: pastBookings, favourites: savedVenues }),
    [pastBookings, savedVenues],
  );
  const chips = useMemo(() => selectChips(userTags), [userTags]);

  const hasStartedChat = messages.some((m) => m.role === 'user');

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      text: trimmed,
      createdAt: new Date(),
    };
    // We send the full conversation (including the new user message) to the
    // coach so it has context.  React's setState is async, so build the
    // outgoing history explicitly.
    const outgoing = [...messages, userMsg];
    setMessages(outgoing);
    setInput('');
    setIsTyping(true);

    try {
      const reply = await sendCoachMessage(outgoing);
      setMessages((m) => [
        ...m,
        { id: nextId(), role: 'assistant', text: reply, createdAt: new Date() },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Coach is unavailable right now.';
      setMessages((m) => [
        ...m,
        {
          id: nextId(),
          role: 'assistant',
          text: `Sorry — I couldn't reach the coach service.\n\n${err}`,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function resetChat() {
    setMessages(mockCoachMessages);
    setInput('');
    setIsTyping(false);
  }

  return (
    <View style={styles.root}>
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {hasStartedChat ? (
            <ScrollView
              ref={scrollRef}
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
              {isTyping && <TypingIndicator />}
            </ScrollView>
          ) : (
            <View style={styles.headingContainer}>
              <Text style={styles.heading}>{CONTEXT_HEADING}</Text>
            </View>
          )}

          {/* Chips only in empty state */}
          {!hasStartedChat && (
            <SuggestionChips chips={chips} onSelect={send} />
          )}

          {/* ── Input bar ── */}
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 84 }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Feeling stuck? Let me help!"
              placeholderTextColor="rgba(255,255,255,0.45)"
              style={styles.input}
              multiline
              onSubmitEditing={() => send(input)}
              blurOnSubmit={false}
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
        </KeyboardAvoidingView>
      </ImageBackground>

      <ChatDrawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNewChat={resetChat}
        recentChats={recentChats}
      />
    </View>
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
  chatListContent: { padding: 16, gap: 14, paddingBottom: 20 },

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
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: 26,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.20)',
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
