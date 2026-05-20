export type FilterCategory = {
  id: string;
  displayName: string;
  dbCategories: string[];
};

export const categoryFilters: FilterCategory[] = [
  {
    id: 'yoga',
    displayName: 'Yoga',
    dbCategories: ['Yoga', 'Pilates', 'Meditation', 'Breathwork', 'Mindfulness', 'Yoga Studio', 'Pilates Studio'],
  },
  {
    id: 'pilates',
    displayName: 'Pilates',
    dbCategories: ['Pilates', 'Pilates Studio', 'Barre'],
  },
  {
    id: 'strength',
    displayName: 'Strength',
    dbCategories: ['Gym', 'HIIT', 'CrossFit', 'Strength', 'Fitness', 'Fitness Center', 'Sports Facility'],
  },
  {
    id: 'recovery',
    displayName: 'Recovery',
    dbCategories: ['Sauna', 'Steam Room', 'Cold Plunge', 'Massage', 'Recovery', 'Recovery Center'],
  },
  {
    id: 'spa',
    displayName: 'Spa',
    dbCategories: ['Spa', 'Wellness', 'Swimming', 'Pool', 'Hot Spring', 'Geothermal Bath', 'Wellness Center', 'Lagoon'],
  },
];

export function matchesCategory(venueCategories: string[], filterId: string): boolean {
  const filter = categoryFilters.find((f) => f.id === filterId);
  if (!filter) return false;
  const dbSet = new Set(filter.dbCategories.map((c) => c.toLowerCase()));
  return venueCategories.some((c) => dbSet.has(c.toLowerCase()));
}
