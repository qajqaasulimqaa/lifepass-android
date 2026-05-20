export type VenueClassification = 'basic' | 'luxury';

export interface Venue {
  id: string;
  name: string;
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
}
