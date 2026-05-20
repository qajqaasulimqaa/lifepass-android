export type BookingStatus = 'confirmed' | 'canceled' | 'completed';

export interface Booking {
  id: string;
  venueId: string;
  venueName: string;
  venueImageUrl: string;
  activityName: string;
  bookingTime: Date;
  status: BookingStatus;
  creditCost: number;
  isLuxury: boolean;
}
