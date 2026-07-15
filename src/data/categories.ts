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
  { id: 'barre',          displayName: 'Barre',            dbCategories: ['Barre'] },
  { id: 'skillx',         displayName: 'SkillX',           dbCategories: ['SkillX', 'Skill'] },
  { id: 'infrared',       displayName: 'Infrared',         dbCategories: ['Infrared', 'Infrared Sauna'] },
  { id: 'padel',          displayName: 'Padel',            dbCategories: ['Padel'] },
  { id: 'mma',            displayName: 'MMA',              dbCategories: ['MMA', 'Mixed Martial Arts'] },
  { id: 'boxing',         displayName: 'Boxing',           dbCategories: ['Boxing'] },
  { id: 'groupclasses',   displayName: 'Group Classes',    dbCategories: ['Group Classes', 'Group Class'] },
  { id: 'grouptraining',  displayName: 'Group Training',   dbCategories: ['Group Training'] },
  { id: 'massage',        displayName: 'Massage',          dbCategories: ['Massage', 'Massage Therapy'] },
  { id: 'swimming',       displayName: 'Swimming',         dbCategories: ['Swimming'] },
  // Boutique is the venue ACCESS category (primaryCategory === 'boutique'), not
  // a display tag — Explore special-cases it via isBoutique(). Mirrors iOS
  // CategoryMapping's 6th top-level "Boutique" chip (monorepo PR #82).
  { id: 'boutique',       displayName: 'Boutique',         dbCategories: ['boutique', 'Boutique'] },
];

/** IDs that belong to the "Gym & Fitness" expandable group. */
export const GYM_GROUP_IDS = [
  'gym', 'strength', 'cardio', 'fitness',
  'barre', 'groupclasses', 'grouptraining', 'skillx', 'infrared',
];

/** IDs that belong to the "Martial Arts" expandable group. */
export const MARTIAL_ARTS_GROUP_IDS = ['mma', 'boxing'];

/** IDs that belong to the "Wellness" expandable group. */
export const WELLNESS_GROUP_IDS = ['pool', 'spa', 'hotspring', 'massage', 'lagoon', 'sauna', 'recovery'];

/** IDs that belong to the "Sports" expandable group. */
export const SPORTS_GROUP_IDS = ['padel', 'golf', 'swimming'];

/** IDs that belong to the "Pilates & Yoga" expandable group. */
export const PILATES_YOGA_GROUP_IDS = ['pilates', 'yoga'];

/** All grouped IDs — used to exclude them from the flat chip row. */
export const ALL_GROUP_IDS = [
  ...GYM_GROUP_IDS,
  ...MARTIAL_ARTS_GROUP_IDS,
  ...WELLNESS_GROUP_IDS,
  ...SPORTS_GROUP_IDS,
  ...PILATES_YOGA_GROUP_IDS,
];

export function matchesCategory(venueCategories: string[], filterId: string): boolean {
  const filter = categoryFilters.find((f) => f.id === filterId);
  if (!filter) return false;
  const dbSet = new Set(filter.dbCategories.map((c) => c.toLowerCase()));
  return venueCategories.some((c) => dbSet.has(c.toLowerCase()));
}
