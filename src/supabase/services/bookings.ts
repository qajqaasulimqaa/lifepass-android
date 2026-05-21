import { supabase } from '../lib/client';
import type { BookingWithDetails, BookingInsert, AvailabilitySlot } from '../types/booking';
import type { Booking } from '../../types/booking';

// ─── Adapter — DB join shape → app camelCase ─────────────────────────────────

export function adaptBooking(db: BookingWithDetails): Booking {
  const act = db.activities;
  const venue = act?.venues;
  return {
    id: db.id,
    venueId: venue?.id ?? '',
    venueName: venue?.name ?? 'Unknown venue',
    venueImageUrl: venue?.image_url ?? `https://picsum.photos/seed/${db.id}/600/400`,
    activityName: act?.name ?? 'Unknown activity',
    bookingTime: new Date(db.booking_time),
    status: db.status as 'confirmed' | 'canceled' | 'completed',
    creditCost: act?.credit_cost ?? 1,
    isLuxury: act?.classification === 'luxury',
  };
}

/** Join string used for all booking queries — mirrors BookingService.swift */
const BOOKING_SELECT =
  '*, activities(id, name, duration_minutes, credit_cost, credit_type, classification, image_url, venues(id, name, address, classification, image_url, track_attendance))';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export async function fetchBookings(upcoming: boolean): Promise<Booking[]> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  let query = supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('user_id', userId);           // explicit filter — see SubscriptionService admin note

  if (upcoming) {
    query = query
      .eq('status', 'confirmed')
      .gte('booking_time', now)
      .order('booking_time', { ascending: true })
      .limit(50);
  } else {
    query = query
      .or(`status.neq.confirmed,booking_time.lt.${now}`)
      .order('booking_time', { ascending: false })
      .limit(50);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as BookingWithDetails[]).map(adaptBooking);
}

export async function fetchUpcomingBookings(limit = 5): Promise<Booking[]> {
  const userId = await getUserId();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .gte('booking_time', now)
    .order('booking_time', { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data as BookingWithDetails[]).map(adaptBooking);
}

export async function createBooking(
  activityId: string,
  bookingTime: Date,
  creditType: string,
): Promise<BookingWithDetails> {
  const insert: BookingInsert = {
    activity_id: activityId,
    booking_time: bookingTime.toISOString(),
    credit_type: creditType,
    status: 'confirmed',
  };

  const { data, error } = await supabase
    .from('bookings')
    .insert(insert)
    .select(BOOKING_SELECT)
    .single();

  if (error) throw error;
  return data as BookingWithDetails;
}

export async function cancelBooking(id: string): Promise<void> {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'canceled' })
    .eq('id', id);
  if (error) throw error;
}

export async function fetchAvailableSlots(
  activityId: string,
  date: Date,
): Promise<AvailabilitySlot[]> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const { data, error } = await supabase
    .from('availability_slots')
    .select('*')
    .eq('activity_id', activityId)
    .eq('is_available', true)
    .gte('start_time', startOfDay.toISOString())
    .lt('start_time', endOfDay.toISOString())
    .order('start_time', { ascending: true });

  if (error) throw error;
  return data as AvailabilitySlot[];
}
