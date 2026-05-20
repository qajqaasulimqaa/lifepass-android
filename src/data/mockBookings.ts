import type { Booking } from '../types/booking';

const now = new Date();
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);
const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

export const mockBookings: Booking[] = [
  {
    id: 'b1',
    venueId: '1',
    venueName: 'Forest Lagoon',
    venueImageUrl: 'https://picsum.photos/seed/forest-lagoon/800/520',
    activityName: 'Evening soak',
    bookingTime: hoursFromNow(5),
    status: 'confirmed',
    creditCost: 3,
    isLuxury: true,
  },
  {
    id: 'b2',
    venueId: '3',
    venueName: 'Reykjavík Gym',
    venueImageUrl: 'https://picsum.photos/seed/rvk-gym/800/520',
    activityName: 'HIIT class',
    bookingTime: daysFromNow(2),
    status: 'confirmed',
    creditCost: 1,
    isLuxury: false,
  },
  {
    id: 'b3',
    venueId: '4',
    venueName: 'Sundhöllin',
    venueImageUrl: 'https://picsum.photos/seed/sundhollin/800/520',
    activityName: 'Morning swim',
    bookingTime: daysFromNow(-3),
    status: 'completed',
    creditCost: 1,
    isLuxury: false,
  },
  {
    id: 'b4',
    venueId: '6',
    venueName: 'Studio Reykjavík',
    venueImageUrl: 'https://picsum.photos/seed/studio-rvk/800/520',
    activityName: 'Yoga flow',
    bookingTime: daysFromNow(-10),
    status: 'completed',
    creditCost: 1,
    isLuxury: false,
  },
];
