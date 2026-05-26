import type { ImageSourcePropType } from 'react-native';

// Categories surfaced on Home as "Want to try something new?".
// Tapping one navigates to the Coach tab and auto-sends the `prompt` so
// the user gets an immediate, relevant reply from Claude.
//
// Image files live in assets/categories/ — filename should match `id`.

export type CoachCategory = {
  id: string;
  label: string;
  image: ImageSourcePropType;
  /** Sent to Coach when this card is tapped. */
  prompt: string;
};

export const coachCategories: CoachCategory[] = [
  {
    id: 'pools',
    label: 'Icelandic Pools',
    image: require('../../assets/categories/pools.jpg'),
    prompt: 'I want to try Icelandic swimming pools — which ones are best to start with this week?',
  },
  {
    id: 'gyms',
    label: 'Gyms & Classes',
    image: require('../../assets/categories/gyms.jpg'),
    prompt: 'Suggest gym classes I should try this week.',
  },
  {
    id: 'wellness',
    label: 'Wellness',
    image: require('../../assets/categories/wellness.jpg'),
    prompt: "I'd like a relaxing wellness day — what do you suggest?",
  },
  {
    id: 'golf',
    label: 'Golf',
    image: require('../../assets/categories/golf.jpg'),
    prompt: 'Tell me about golf options available through LifePass.',
  },
  {
    id: 'spa',
    label: 'Spa & Lagoons',
    image: require('../../assets/categories/spa.jpg'),
    prompt: 'Plan a perfect spa or lagoon evening for me.',
  },
  {
    id: 'yoga',
    label: 'Yoga & Pilates',
    image: require('../../assets/categories/yoga.jpg'),
    prompt: "I'm new to yoga — where should I start in Reykjavík?",
  },
];
