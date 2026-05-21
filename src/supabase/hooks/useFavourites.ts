import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Venue as AppVenue } from '../../types/venue';
import {
  fetchFavouriteVenues,
  addFavouriteVenue,
  removeFavouriteByVenue,
  isFavourited,
} from '../services/favourites';

type FavouritesState = {
  savedVenues: AppVenue[];
  savedVenueIds: string[];
  loading: boolean;
  error: string | null;
  toggle: (venueId: string) => Promise<void>;
  refetch: () => void;
};

export function useFavouriteVenues(): FavouritesState {
  const [savedVenues, setSavedVenues] = useState<AppVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchFavouriteVenues()
      .then(setSavedVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggle(venueId: string) {
    const already = await isFavourited(venueId);
    if (already) {
      await removeFavouriteByVenue(venueId);
      setSavedVenues((prev) => prev.filter((v) => v.id !== venueId));
    } else {
      await addFavouriteVenue(venueId);
      load(); // refetch to get the full adapted row
    }
  }

  const savedVenueIds = useMemo(() => savedVenues.map((v) => v.id), [savedVenues]);

  return { savedVenues, savedVenueIds, loading, error, toggle, refetch: load };
}
