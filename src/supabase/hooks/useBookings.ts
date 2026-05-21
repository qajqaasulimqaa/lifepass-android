import { useCallback, useEffect, useState } from 'react';
import type { Booking } from '../../types/booking';
import { fetchBookings, cancelBooking } from '../services/bookings';

type BookingsState = {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  cancel: (id: string) => Promise<void>;
  refetch: () => void;
};

export function useBookings(upcoming: boolean): BookingsState {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchBookings(upcoming)
      .then(setBookings)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [upcoming]);

  useEffect(() => { load(); }, [load]);

  async function cancel(id: string) {
    await cancelBooking(id);
    // Optimistic update — remove from list immediately
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  return { bookings, loading, error, cancel, refetch: load };
}
