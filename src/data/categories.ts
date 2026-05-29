// ─── Category filter ──────────────────────────────────────────────────────────

export type FilterCategory = {
  id: string;
  displayName: string;
  /** DB strings stored in venue.category that count as this filter. */
  dbCategories: string[];
};

// All 27 activity categories. Order here controls the chip order.
export const categoryFilters: FilterCategory[] = [
  { id: 'cardio',         displayName: 'Cardio',          dbCategories: ['Cardio'] },
  { id: 'strength',       displayName: 'Strength',         dbCategories: ['Strength'] },
  { id: 'gym',            displayName: 'Gym',              dbCategories: ['Gym', 'Fitness Center'] },
  { id: 'pool',           displayName: 'Pool',             dbCategories: ['Pool', 'Swimming Pool'] },
  { id: 'fitness',        displayName: 'Fitness',          dbCategories: ['Fitness'] },
  { id: 'spa',            displayName: 'Spa',              dbCategories: ['Spa'] },
  { id: 'sauna',          displayName: 'Sauna',            dbCategories: ['Sauna', 'Steam Room'] },
  { id: 'lagoon',         displayName: 'Lagoon',           dbCategories: ['Lagoon', 'Geothermal Bath'] },
  { id: 'hotspring',      displayName: 'Hot Spring',       dbCategories: ['Hot Spring', 'Hot Springs', 'Geothermal'] },
  { id: 'golf',           displayName: 'Golf',             dbCategories: ['Golf', 'Golf Course'] },
  { id: 'pilates',        displayName: 'Pilates',          dbCategories: ['Pilates', 'Pilates Studio'] },
  { id: 'yoga',           displayName: 'Yoga',             dbCategories: ['Yoga', 'Yoga Studio', 'Meditation', 'Breathwork', 'Mindfulness'] },
  { id: 'recovery',       displayName: 'Recovery',         dbCategories: ['Recovery', 'Recovery Center', 'Cold Plunge'] },
  { id: 'wellness',       displayName: 'Wellness',         dbCategories: ['Wellness', 'Wellness Center'] },
  { id: 'barre',          displayName: 'Barre',            dbCategories: ['Barre'] },
  { id: 'skillx',         displayName: 'SkillX',           dbCategories: ['SkillX', 'Skill'] },
  { id: 'infrared',       displayName: 'Infrared',         dbCategories: ['Infrared', 'Infrared Sauna'] },
  { id: 'sports',         displayName: 'Sports',           dbCategories: ['Sports', 'Sports Facility'] },
  { id: 'padel',          displayName: 'Padel',            dbCategories: ['Padel'] },
  { id: 'mma',            displayName: 'MMA',              dbCategories: ['MMA', 'Mixed Martial Arts'] },
  { id: 'boxing',         displayName: 'Boxing',           dbCategories: ['Boxing'] },
  { id: 'groupclasses',   displayName: 'Group Classes',    dbCategories: ['Group Classes', 'Group Class'] },
  { id: 'grouptraining',  displayName: 'Group Training',   dbCategories: ['Group Training'] },
  { id: 'massage',        displayName: 'Massage',          dbCategories: ['Massage', 'Massage Therapy'] },
  { id: 'chiro',          displayName: 'Chiropractic',     dbCategories: ['Chiropractic', 'Chiropractor'] },
  { id: 'swimming',       displayName: 'Swimming',         dbCategories: ['Swimming'] },
];

/** IDs that belong to the "Gym & Fitness" expandable group. */
export const GYM_GROUP_IDS = [
  'gym', 'strength', 'cardio', 'fitness',
  'barre', 'groupclasses', 'grouptraining', 'skillx',
];

export function matchesCategory(venueCategories: string[], filterId: string): boolean {
  const filter = categoryFilters.find((f) => f.id === filterId);
  if (!filter) return false;
  const dbSet = new Set(filter.dbCategories.map((c) => c.toLowerCase()));
  return venueCategories.some((c) => dbSet.has(c.toLowerCase()));
}

// ─── Credit range filter ──────────────────────────────────────────────────────

export type CreditRange = 'all' | '1-2' | '3-5' | '6+';

export const CREDIT_FILTERS: { id: CreditRange; label: string }[] = [
  { id: 'all',  label: 'All' },
  { id: '1-2',  label: '1–2 cr' },
  { id: '3-5',  label: '3–5 cr' },
  { id: '6+',   label: '6+ cr' },
];

export function matchesCreditRange(creditCost: number, range: CreditRange): boolean {
  if (range === 'all') return true;
  if (range === '1-2') return creditCost >= 1 && creditCost <= 2;
  if (range === '3-5') return creditCost >= 3 && creditCost <= 5;
  return creditCost >= 6; // '6+'
}
