// Profile reads from the LifePass v1 API — mirrors lifepass-ios
// Services/API + Models/Profile.swift. Today this only pulls the member's
// `recentCheckIn` (the staff proof); identity still comes from Supabase auth.
import { apiGet } from '../../api/client';
import type { RecentCheckIn } from '../types/profile';

type ApiProfile = { recentCheckIn?: unknown };

/**
 * `GET /profile` → the member's recent check-in (staff proof), or null.
 *
 * FAIL-SOFT, mirroring iOS `FailSoft<RecentCheckIn>`: a malformed value — an
 * unparseable `checkedInAt`, a renamed venue field — is DISCARDED, never thrown.
 * A nice-to-have banner must never be able to break the app, and this keeps it
 * safe to ship before the API half (monorepo #128) sends the field: no field,
 * no banner, no crash.
 */
export async function fetchRecentCheckIn(): Promise<RecentCheckIn | null> {
  try {
    const profile = await apiGet<ApiProfile>('/profile');
    return adaptRecentCheckIn(profile?.recentCheckIn);
  } catch {
    // A failed /profile read must not surface — just no banner.
    return null;
  }
}

function adaptRecentCheckIn(raw: unknown): RecentCheckIn | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, any>;
    if (typeof r.checkInId !== 'string' || typeof r.checkedInAt !== 'string') return null;
    if (!r.venue || typeof r.venue.id !== 'string' || typeof r.venue.name !== 'string') return null;

    const checkedInAt = new Date(r.checkedInAt);
    if (Number.isNaN(checkedInAt.getTime())) return null; // unparseable timestamp → discard

    const activity =
      r.activity && typeof r.activity.id === 'string' && typeof r.activity.name === 'string'
        ? { id: r.activity.id, name: r.activity.name }
        : null;

    return {
      checkInId: r.checkInId,
      checkedInAt,
      memberName: typeof r.memberName === 'string' ? r.memberName : null,
      venue: { id: r.venue.id, name: r.venue.name },
      activity,
    };
  } catch {
    return null; // any parse issue → discard (fail-soft)
  }
}
