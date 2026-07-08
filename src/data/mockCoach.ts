import type { ChatMessage } from '../types/coach';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ActivityTag =
  | 'lagoon'
  | 'gym'
  | 'yoga'
  | 'swimming'
  | 'recovery'
  | 'credits'
  | 'general';

export type SuggestionChip = {
  id: string;
  text: string;
  /** Sent to the coach when tapped. Empty for category-strip chips. */
  prompt: string;
  /**
   * When true the chip doesn't name a venue type — tapping it shows the
   * category strip so the member picks what they're after (mirrors iOS
   * `showsCategoryStrip`).
   */
  showsCategoryStrip?: boolean;
};

export type RecentChat = { id: string; title: string };

// ─── Initial message ──────────────────────────────────────────────────────────

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);

export const mockCoachMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    text: "Hi! I'm your LifePass coach. Ask me about venues near you, or tap a suggestion below.",
    createdAt: minutesAgo(1),
  },
];

// ─── Suggestion chips (mirrors iOS CoachView.suggestionChips) ─────────────────
//
// Three of the four don't name a specific venue type, so rather than
// presuming one they show the category strip and let the member pick.
// "Lagoon enthusiast" names its type, so it sends a prompt the venue-search
// detector picks up and runs the lagoon wizard on.

export const suggestionChips: SuggestionChip[] = [
  { id: 'c1', text: "What's nearby?",    prompt: '', showsCategoryStrip: true },
  { id: 'c2', text: 'After work',        prompt: '', showsCategoryStrip: true },
  {
    id: 'c3',
    text: 'Lagoon enthusiast',
    prompt: 'I love geothermal lagoons. Which ones should I try next in Iceland?',
  },
  { id: 'c4', text: 'Something new',     prompt: '', showsCategoryStrip: true },
];

/** Same four chips for everyone — kept as a function for the call site. */
export function selectChips(_userTags: ActivityTag[]): SuggestionChip[] {
  return suggestionChips;
}

// (The RECENTS list is real now — persisted sessions in src/coach/chatSessions.ts.)

