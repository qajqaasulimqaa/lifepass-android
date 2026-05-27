import type { QuestionOption } from '../types/coach';

export interface QuestionDef {
  text: string;
  options: QuestionOption[];
}

// ─── Shared location chips (Q2 for every category) ────────────────────────────

export const LOCATION_OPTIONS: QuestionOption[] = [
  { label: '📍 Close by',    value: '__closeby__' },
  { label: 'South Iceland',  value: 'south' },
  { label: 'North Iceland',  value: 'north' },
  { label: 'East Iceland',   value: 'east' },
  { label: 'West Iceland',   value: 'west' },
];

const LOCATION_Q: QuestionDef = {
  text: 'Where in Iceland?',
  options: LOCATION_OPTIONS,
};

// ─── Question sets per category ───────────────────────────────────────────────

export const VENUE_QUESTIONS: Record<string, QuestionDef[]> = {
  gym: [
    {
      text: 'What type of training are you after?',
      options: [
        { label: 'Weightlifting',  value: 'weightlifting' },
        { label: 'MMA & Combat',   value: 'MMA and combat sports' },
        { label: 'Spinning',       value: 'spinning classes' },
        { label: 'CrossFit',       value: 'CrossFit' },
        { label: 'Pilates',        value: 'pilates' },
        { label: 'Other',          value: '', isOther: true },
      ],
    },
    LOCATION_Q,
    {
      text: 'Any must-have amenities?',
      options: [
        { label: 'Has sauna',      value: 'with a sauna' },
        { label: 'Open evenings',  value: 'open in the evening' },
        { label: '1 credit only',  value: 'costing only 1 credit' },
        { label: 'No preference',  value: '' },
      ],
    },
  ],

  lagoon: [
    {
      text: 'What kind of experience?',
      options: [
        { label: 'Geothermal pools',    value: 'geothermal pools' },
        { label: 'Sauna & cold plunge', value: 'sauna and cold plunge' },
        { label: 'Luxury spa',          value: 'luxury spa experience' },
        { label: 'Natural hot spring',  value: 'natural hot spring' },
      ],
    },
    LOCATION_Q,
    {
      text: 'Credit budget?',
      options: [
        { label: '1 credit',           value: 'within 1 credit' },
        { label: '3 credits (luxury)', value: 'up to 3 luxury credits' },
        { label: 'No preference',      value: '' },
      ],
    },
  ],

  yoga: [
    {
      text: 'What style of class?',
      options: [
        { label: 'Vinyasa & Flow',    value: 'vinyasa flow yoga' },
        { label: 'Yin & Restorative', value: 'yin and restorative yoga' },
        { label: 'Pilates reformer',  value: 'pilates reformer' },
        { label: 'Hot yoga',          value: 'hot yoga' },
        { label: 'Other',             value: '', isOther: true },
      ],
    },
    LOCATION_Q,
    {
      text: 'Your experience level?',
      options: [
        { label: 'Beginner',      value: 'suitable for beginners' },
        { label: 'Intermediate',  value: 'intermediate level' },
        { label: 'Advanced',      value: 'advanced level' },
        { label: 'Any level',     value: '' },
      ],
    },
  ],

  swimming: [
    {
      text: 'What are you after?',
      options: [
        { label: 'Lap swimming',      value: 'lap swimming lanes' },
        { label: 'Hot tubs & relax',  value: 'hot tubs and relaxation' },
        { label: 'Outdoor pool',      value: 'outdoor heated pool' },
        { label: 'Family-friendly',   value: 'family-friendly facilities' },
      ],
    },
    LOCATION_Q,
    {
      text: 'Any extras?',
      options: [
        { label: 'Has steam room', value: 'with a steam room' },
        { label: 'Has sauna',      value: 'with a sauna' },
        { label: 'Open early',     value: 'open early in the morning' },
        { label: 'No preference',  value: '' },
      ],
    },
  ],

  spa: [
    {
      text: 'What type of experience?',
      options: [
        { label: 'Traditional sauna',  value: 'traditional sauna' },
        { label: 'Steam room',         value: 'steam room' },
        { label: 'Full spa treatment', value: 'full spa treatment' },
        { label: 'Sauna & pool combo', value: 'sauna and pool combination' },
        { label: 'Other',              value: '', isOther: true },
      ],
    },
    LOCATION_Q,
    {
      text: 'Credit budget?',
      options: [
        { label: '1 credit',           value: 'within 1 credit' },
        { label: '3 credits (luxury)', value: 'up to 3 luxury credits' },
        { label: 'No preference',      value: '' },
      ],
    },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const CLOSEBY_VALUE = '__closeby__';

/** Returns a category key if the message is a venue search, else null. */
export function detectVenueCategory(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bgym\b|gyms|workout|fitness|weightlift|crossfit|\bmma\b|combat|spinning/.test(t)) return 'gym';
  if (/lagoon|hot spring|geothermal|thermal pool/.test(t)) return 'lagoon';
  if (/\byoga\b|pilates|vinyasa|yin yoga|hot yoga/.test(t)) return 'yoga';
  if (/\bpool\b|pools|swimming|swim lane/.test(t)) return 'swimming';
  if (/\bspa\b|saunas?|steam room|wellness|recovery/.test(t)) return 'spa';
  return null;
}
