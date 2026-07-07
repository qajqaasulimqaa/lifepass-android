// Coach chat-session persistence — mirrors lifepass-ios CoachViewModel's
// UserDefaults sessions (same "coach.sessions.v1" key), stored in
// AsyncStorage. Unlike iOS we ALSO persist venue cards and the category
// picker, so a restored chat keeps its tappable booking options — cards are
// plain data and "Book it" resolves against the live venue anyway. Only
// mid-flow Q&A bubbles are dropped (their answers live on as user messages,
// and re-answering a dead flow would corrupt state).
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, VenueCard } from '../types/coach';

const SESSIONS_KEY = 'coach.sessions.v1';
/** How many recents the drawer keeps. (iOS keeps 3; Android shows 4.) */
export const MAX_SESSIONS = 4;

type PersistedMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  /** Booking-option cards, kept so restored chats stay actionable. */
  venueCards?: VenueCard[];
  /** Drives the carousel's "Other Ideas" button. */
  searchQuery?: string;
  /** Trailing "explore something else?" strip — renders from static data. */
  categoryPicker?: boolean;
};

export type ChatSession = {
  id: string;
  title: string;
  /** ISO timestamp of the last save. */
  date: string;
  messages: PersistedMessage[];
};

export async function loadSessions(): Promise<ChatSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as ChatSession[]) : [];
  } catch {
    return [];
  }
}

async function saveSessions(sessions: ChatSession[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Best-effort — a failed write only costs the recents list.
  }
}

/**
 * Snapshot the live conversation, or null when there's nothing worth saving
 * (no user message yet). Title = first user message, clipped to 40 chars —
 * same rules as the iOS persistCurrentSession().
 */
export function buildSession(
  messages: ChatMessage[],
  existingId: string | null,
): ChatSession | null {
  if (!messages.some((m) => m.role === 'user')) return null;
  const raw = messages.find((m) => m.role === 'user')?.text.trim() || 'Chat';
  const title = raw.length > 40 ? `${raw.slice(0, 37)}…` : raw;
  const persisted = messages
    .filter((m) => !m.questionOptions)
    .map((m) => ({
      id: m.id,
      role: m.role,
      text: m.text,
      venueCards: m.venueCards,
      searchQuery: m.searchQuery,
      categoryPicker: m.categoryPicker,
    }));
  return {
    id: existingId ?? `s-${Date.now()}`,
    title,
    date: new Date().toISOString(),
    messages: persisted,
  };
}

/**
 * Upsert newest-first (re-saving the same conversation moves it to the top
 * instead of duplicating it), cap at MAX_SESSIONS, persist. Returns the list.
 */
export async function upsertSession(
  sessions: ChatSession[],
  session: ChatSession,
): Promise<ChatSession[]> {
  const next = [session, ...sessions.filter((s) => s.id !== session.id)].slice(0, MAX_SESSIONS);
  await saveSessions(next);
  return next;
}

/** Rehydrate persisted messages into live ChatMessage objects. */
export function messagesFromSession(session: ChatSession): ChatMessage[] {
  return session.messages.map((m) => ({
    id: m.id,
    role: m.role,
    text: m.text,
    createdAt: new Date(session.date),
    venueCards: m.venueCards,
    searchQuery: m.searchQuery,
    categoryPicker: m.categoryPicker,
  }));
}
