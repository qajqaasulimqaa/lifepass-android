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
    text: "Hi — I'm your LifePass coach. Ask me about venues near you, or tap a suggestion below.",
    createdAt: minutesAgo(1),
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
    text: 'Find lagoons',
    tags: ['lagoon', 'recovery'],
    prompt: 'Show me geothermal lagoons I can visit in Iceland.',
  },
  {
    id: 'c4',
    text: 'Yoga studios',
    tags: ['yoga'],
    prompt: 'Show me yoga studios available in Reykjavík.',
  },
  {
    id: 'c5',
    text: 'Swimming pools',
    tags: ['swimming'],
    prompt: 'Show me the best swimming pools near Reykjavík.',
  },
  {
    id: 'c6',
    text: 'Find gyms',
    tags: ['gym'],
    prompt: 'Show me gyms I can visit in Reykjavík.',
  },
  {
    id: 'c7',
    text: 'Spas & saunas',
    tags: ['recovery'],
    prompt: 'Show me spas and saunas I can visit in Iceland.',
  },
  {
    id: 'c8',
    text: 'Use my credits',
    tags: ['credits', 'general'],
    prompt: "I have credits to use before they expire. What's the best way to spend them?",
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

