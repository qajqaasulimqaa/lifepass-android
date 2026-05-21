// Categories surfaced on Home as "Want to try something new?".
// Tapping one navigates to the Coach tab and auto-sends the `prompt` so
// the user gets an immediate, relevant reply from Claude.

export type CoachCategory = {
  id: string;
  label: string;
  imageUrl: string;
  /** Sent to Coach when this card is tapped. */
  prompt: string;
};

export const coachCategories: CoachCategory[] = [
  {
    id: 'pools',
    label: 'Icelandic Pools',
    imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&q=80',
    prompt: 'I want to try Icelandic swimming pools — which ones are best to start with this week?',
  },
  {
    id: 'gyms',
    label: 'Gyms & Classes',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&q=80',
    prompt: 'Suggest gym classes I should try this week.',
  },
  {
    id: 'wellness',
    label: 'Wellness & Spas',
    imageUrl: 'https://images.unsplash.com/photo-1583416750470-965b2707b355?w=400&q=80',
    prompt: "I'd like a relaxing wellness day — what do you suggest?",
  },
  {
    id: 'golf',
    label: 'Golf',
    imageUrl: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=400&q=80',
    prompt: 'Tell me about golf options available through LifePass.',
  },
  {
    id: 'lagoons',
    label: 'Lagoons',
    imageUrl: 'https://images.unsplash.com/photo-1543372054-77191a875871?w=400&q=80',
    prompt: 'Plan a perfect lagoon evening for me.',
  },
  {
    id: 'yoga',
    label: 'Yoga & Pilates',
    imageUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400&q=80',
    prompt: "I'm new to yoga — where should I start in Reykjavík?",
  },
];
