import { supabase } from '../lib/client';
import type { Favourite, FavouriteInsert } from '../types/favourite';
import type { Venue as AppVenue } from '../../types/venue';
import { adaptVenue } from './venues';
import type { Venue as DbVenue } from '../types/venue';

async function getUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user.id;
}

export async function fetchFavouriteVenues(): Promise<AppVenue[]> {
  const { data, error } = await supabase
    .from('favourites')
    .select('*, venue:venues(*)')
    .not('venue_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as (Favourite & { venue: DbVenue | null })[])
    .filter((f) => f.venue != null)
    .map((f) => adaptVenue(f.venue as DbVenue));
}

export async function fetchFavouriteActivities(): Promise<Favourite[]> {
  const { data, error } = await supabase
    .from('favourites')
    .select('*, activity:activities(*)')
    .not('activity_id', 'is', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Favourite[];
}

export async function isFavourited(venueId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('favourites')
    .select('id')
    .eq('venue_id', venueId)
    .limit(1);
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function addFavouriteVenue(venueId: string): Promise<void> {
  const userId = await getUserId();
  const insert: FavouriteInsert = { user_id: userId, venue_id: venueId, activity_id: null };
  const { error } = await supabase.from('favourites').insert(insert);
  if (error) throw error;
}

export async function addFavouriteActivity(activityId: string): Promise<void> {
  const userId = await getUserId();
  const insert: FavouriteInsert = { user_id: userId, venue_id: null, activity_id: activityId };
  const { error } = await supabase.from('favourites').insert(insert);
  if (error) throw error;
}

export async function removeFavouriteByVenue(venueId: string): Promise<void> {
  const { error } = await supabase
    .from('favourites')
    .delete()
    .eq('venue_id', venueId);
  if (error) throw error;
}

export async function removeFavouriteById(id: string): Promise<void> {
  const { error } = await supabase.from('favourites').delete().eq('id', id);
  if (error) throw error;
}
