import { useCallback, useEffect, useState } from 'react';
import type { Venue, Activity, VenueReview } from '../../types/venue';
import { fetchVenues, fetchVenueById, fetchActivities, fetchVenueReviews } from '../services/venues';

type VenuesState = {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useVenues(opts?: { search?: string; city?: string }): VenuesState {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchVenues(opts)
      .then(setVenues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [opts?.search, opts?.city]);

  useEffect(() => { load(); }, [load]);

  return { venues, loading, error, refetch: load };
}

type VenueByIdState = {
  venue: Venue | null;
  loading: boolean;
  error: string | null;
};

export function useVenueById(id: string): VenueByIdState {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchVenueById(id)
      .then(setVenue)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { venue, loading, error };
}

type ActivitiesState = {
  activities: Activity[];
  loading: boolean;
  error: string | null;
};

export function useActivities(venueId: string): ActivitiesState {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchActivities(venueId)
      .then(setActivities)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [venueId]);

  return { activities, loading, error };
}

type ReviewsState = {
  reviews: VenueReview[];
  loading: boolean;
  error: string | null;
};

export function useVenueReviews(venueId: string): ReviewsState {
  const [reviews, setReviews] = useState<VenueReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchVenueReviews(venueId)
      .then(setReviews)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [venueId]);

  return { reviews, loading, error };
}
