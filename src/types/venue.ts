export type VenueClassification = 'basic' | 'luxury';

export interface OpeningHoursDay {
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface OpeningHours {
  monday?: OpeningHoursDay;
  tuesday?: OpeningHoursDay;
  wednesday?: OpeningHoursDay;
  thursday?: OpeningHoursDay;
  friday?: OpeningHoursDay;
  saturday?: OpeningHoursDay;
  sunday?: OpeningHoursDay;
}

export interface Activity {
  id: string;
  name: string;
  imageUrl: string;
  creditCost: number;
  durationMinutes: number;
  classification: VenueClassification;
}

export interface VenueReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  classification: VenueClassification;
  category: string[];
  creditCost: number;
  walkInsAllowed: boolean;
  walkInCreditCost: number;
  amenities: string[];
  openingHours: OpeningHours;
  phone: string;
  averageRating: number;
  totalReviews: number;
  activities: Activity[];
  reviews: VenueReview[];
  specialInstructions?: string;
}
