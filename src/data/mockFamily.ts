import { FamilyMember } from '@/types';

export const mockFamily: FamilyMember[] = [
  {
    id: 'fam-1',
    name: 'Sarah Carter',
    relation: 'Partner',
    initials: 'SC',
    status: 'Safe',
    tone: 'success',
    phone: '+1 (555) 014-2201',
    lastKnownLocation: 'Riverside district · shared 12 min ago',
  },
  {
    id: 'fam-2',
    name: 'Daniel Carter',
    relation: 'Brother',
    initials: 'DC',
    status: 'Checking in',
    tone: 'warning',
    phone: '+1 (555) 014-2202',
    lastKnownLocation: 'Location not shared yet',
  },
  {
    id: 'fam-3',
    name: 'Maya Carter',
    relation: 'Daughter',
    initials: 'MC',
    status: 'Safe',
    tone: 'success',
    phone: '+1 (555) 014-2203',
    lastKnownLocation: 'Riverside district · shared 40 min ago',
  },
];
