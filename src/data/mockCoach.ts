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
  prompt: string;
  tags: ActivityTag[];
};

export type RecentChat = { id: string; title: string };

// ─── Initial message ──────────────────────────────────────────────────────────

const minutesAgo = (m: number) => new Date(Date.now() - m * 60 * 1000);

export const mockCoachMessages: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    text: "Hi Kaja — I'm your LifePass coach. I can help you plan your week, suggest classes near you, or build a recovery routine. What's on your mind?",
    createdAt: minutesAgo(8),
  },
];

// ─── Chip bank (8 chips, each tagged with activity context) ───────────────────

export const chipBank: SuggestionChip[] = [
  {
    id: 'c1',
    text: 'Plan my week',
    tags: ['general'],
    prompt: 'Help me plan a 4-day wellness week with strength and recovery.',
  },
  {
    id: 'c2',
    text: 'After the gym',
    tags: ['gym', 'recovery'],
    prompt: "I just finished a hard gym session. What should I do to recover well today?",
  },
  {
    id: 'c3',
    text: 'Lagoon ritual',
    tags: ['lagoon', 'recovery'],
    prompt: 'Plan a perfect lagoon evening for stress relief.',
  },
  {
    id: 'c4',
    text: 'New to yoga',
    tags: ['yoga'],
    prompt: "I'm new to yoga. Where should I start in Reykjavík?",
  },
  {
    id: 'c5',
    text: 'Best swim spots',
    tags: ['swimming'],
    prompt: 'What are the best swimming pools or outdoor spots near me this week?',
  },
  {
    id: 'c6',
    text: 'HIIT this week',
    tags: ['gym'],
    prompt: 'I want to do 2–3 HIIT sessions this week. What do you recommend?',
  },
  {
    id: 'c7',
    text: 'Use my credits',
    tags: ['credits', 'general'],
    prompt: "I have credits to use before they expire. What's the best way to spend them?",
  },
  {
    id: 'c8',
    text: 'Relaxing evening',
    tags: ['lagoon', 'recovery'],
    prompt: 'Suggest a relaxing evening routine — something warm and restorative.',
  },
];

/**
 * Pick the 4 chips most relevant to the user's current activity profile.
 * Chips are scored by how many of their tags match the user's activity tags.
 * Ties preserve the original bank order.
 */
export function selectChips(userTags: ActivityTag[]): SuggestionChip[] {
  const tagSet = new Set(userTags);

  const scored = chipBank.map((chip) => ({
    chip,
    // each matching tag +1, 'general' always gets +0.5 so it fills gaps
    score: chip.tags.reduce(
      (acc, t) => acc + (tagSet.has(t) ? 1 : 0) + (t === 'general' ? 0.5 : 0),
      0,
    ),
  }));

  // Stable sort — ties keep bank order
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.chip);
}

// ─── Recent chats ─────────────────────────────────────────────────────────────

export const recentChats: RecentChat[] = [
  { id: 'r1', title: 'Cool pools nearby' },
  { id: 'r2', title: 'Gyms and leg day' },
  { id: 'r3', title: 'Lagoons worth visiting' },
  { id: 'r4', title: 'Core and MMA practice' },
  { id: 'r5', title: 'Yoga for beginners' },
  { id: 'r6', title: 'Recovery after marathon' },
  { id: 'r7', title: 'Best lagoons in Reykjavík' },
];

