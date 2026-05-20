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

// ─── Canned replies ───────────────────────────────────────────────────────────

const cannedReplies: { match: RegExp; reply: string }[] = [
  {
    match: /plan.*week|weekly|schedule/i,
    reply:
      "Here's a balanced 4-day plan:\n\n• Mon — Vinyasa Flow at Studio Reykjavík (mobility)\n• Wed — HIIT 45 at Reykjavík Gym (strength)\n• Fri — Strength foundations (volume)\n• Sun — Forest Lagoon (recovery)\n\nWant me to look at slot availability for any of these?",
  },
  {
    match: /recover|sore|tired|rest|after.*gym/i,
    reply:
      'Try this 2-day reset:\n\n1. Saturday — slow swim + steam at Sundhöllin (1 cr)\n2. Sunday — soak + cold plunge at Forest Lagoon (3 cr)\n\nLight movement on day one, full immersion on day two. Want a yin yoga session in between?',
  },
  {
    match: /yoga|beginner|new/i,
    reply:
      "Studio Reykjavík runs slow Vinyasa twice a week — a great intro. Yin & restorative on Sunday is perfect for a wind-down. Both are 1 credit each.",
  },
  {
    match: /lagoon|spa|bath|relax/i,
    reply:
      'For a stress-relief evening: Forest Lagoon at 19:00 — cedar pools, cold plunge cycle (3 rounds), finish in the sauna. Eat something light beforehand. 3 credits.',
  },
  {
    match: /swim|pool|outdoor/i,
    reply:
      'Top picks this week:\n\n• Sundhöllin — historic outdoor pool, open late (1 cr)\n• Laugardalslaug — biggest in the city, great lanes (1 cr)\n• Nauthólsvík — geothermal beach, free entry\n\nAll within 15 min of central Reykjavík.',
  },
  {
    match: /hiit|strength|workout/i,
    reply:
      'Reykjavík Gym has HIIT 45 on Mon/Wed/Fri at 18:00 — always busy but worth it. For something smaller, KEA Fitness runs 30-min express circuits at lunch. Both 1 credit each.',
  },
  {
    match: /credit|expire|spend/i,
    reply:
      "You have 12 credits — here's how I'd use them:\n\n• 3 cr → Forest Lagoon (luxury, counts toward your cap)\n• 2 × 1 cr → HIIT classes at Reykjavík Gym\n• 1 cr → Vinyasa Flow at Studio Reykjavík\n\nThat's a solid week with recovery built in.",
  },
];

export function getCannedReply(userMessage: string): string {
  const hit = cannedReplies.find((r) => r.match.test(userMessage));
  return (
    hit?.reply ??
    "Got it. I'm still in beta — connect me to your booking history and I'll start tailoring suggestions to what you've actually done. In the meantime, try one of the prompts above."
  );
}
