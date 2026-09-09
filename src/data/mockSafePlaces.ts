import { SafePlace } from '@/types';

export const mockSafePlaces: SafePlace[] = [
  {
    id: 'place-1',
    name: 'Riverside Community Hall',
    detail: '0.4 mi · Open now',
    status: 'Open',
    distanceMiles: 0.4,
    latitude: 28.6139,
    longitude: 77.209,
    phone: '+91 11 4567 8901',
  },
  {
    id: 'place-2',
    name: 'Northside Medical Centre',
    detail: '0.8 mi · 24 hours',
    status: '24h',
    distanceMiles: 0.8,
    latitude: 28.6229,
    longitude: 77.216,
    phone: '+91 11 4567 8902',
  },
  {
    id: 'place-3',
    name: 'Central Library',
    detail: '1.2 mi · Open until 8pm',
    status: 'Open',
    distanceMiles: 1.2,
    latitude: 28.6304,
    longitude: 77.2177,
    phone: '+91 11 4567 8903',
  },
];
