export type SubscriptionTier = 'S' | 'M' | 'L' | 'XL';

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  planDisplayName: string;
  totalCredits: number;
  expiresAt: Date;
  hasLuxuryAccess: boolean;
  luxuryVisitCap: number | null;
  luxuryVisitsUsed: number;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  kennitala?: string;
}

export interface TimeSlot {
  id: string;
  startTime: Date;
  spotsRemaining?: number;
}
