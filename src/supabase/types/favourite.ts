import type { Venue, Activity } from './venue';

export type Favourite = {
  id: string;
  user_id: string | null;
  venue_id: string | null;
  activity_id: string | null;
  created_at: string | null;
  // Joined data — present when selected with venue:venues(*) or activity:activities(*)
  venue?: Venue | null;
  activity?: Activity | null;
};

export type FavouriteInsert = {
  user_id: string;
  venue_id: string | null;
  activity_id: string | null;
};
