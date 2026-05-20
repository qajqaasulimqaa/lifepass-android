import type { Subscription, Profile, TimeSlot } from '../types/subscription';

export const mockProfile: Profile = {
  id: 'u1',
  fullName: 'Kaja Sulima',
  email: 'kaja.sulima@gmail.com',
  kennitala: '0101901239',
};

export const mockSubscription: Subscription = {
  id: 's1',
  tier: 'L',
  planDisplayName: 'Plan L · Premium',
  totalCredits: 12,
  expiresAt: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000),
  hasLuxuryAccess: true,
  luxuryVisitCap: 6,
  luxuryVisitsUsed: 2,
};

export function mockSlotsForDate(date: Date): TimeSlot[] {
  const baseDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const times = [
    { h: 6, m: 30 },
    { h: 8, m: 0 },
    { h: 9, m: 30 },
    { h: 12, m: 0 },
    { h: 16, m: 30 },
    { h: 18, m: 0 },
    { h: 19, m: 15 },
    { h: 20, m: 30 },
  ];
  return times.map((t, i) => ({
    id: `slot-${date.toDateString()}-${i}`,
    startTime: new Date(baseDay.getTime() + (t.h * 60 + t.m) * 60 * 1000),
    spotsRemaining: i % 3 === 0 ? undefined : 8 - i,
  }));
}
