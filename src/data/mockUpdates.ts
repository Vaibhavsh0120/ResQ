import { UpdateAlert } from '@/types';

export const mockUpdates: UpdateAlert[] = [
  {
    id: 'update-1',
    title: 'Heavy rain expected tonight',
    detail: 'Local weather service · 12 min ago',
    tone: 'warning',
    iconName: 'CloudRain',
    source: { id: 'src-weather-1', title: 'Local weather service bulletin', publisher: 'National Weather Service' },
  },
  {
    id: 'update-2',
    title: 'Community hall is open',
    detail: 'Riverside district · 28 min ago',
    tone: 'success',
    iconName: 'Home',
    source: { id: 'src-community-1', title: 'Riverside district notice', publisher: 'Community board' },
  },
  {
    id: 'update-3',
    title: 'Road closure near Northside',
    detail: 'Community report · 46 min ago',
    tone: 'danger',
    iconName: 'CarFront',
    source: { id: 'src-report-1', title: 'Community report', publisher: 'ResQ community reports' },
  },
];
