export type ReadinessChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type ReadinessStep = {
  id: string;
  title: string;
  detail: string;
  iconName: 'BriefcaseMedical' | 'Droplets' | 'Flashlight' | 'Radio';
};

export type ReadinessSummary = {
  score: number; // 0-100
  headline: string;
  subtext: string;
  checklist: ReadinessChecklistItem[];
  nextSteps: ReadinessStep[];
};

export const mockReadiness: ReadinessSummary = {
  score: 82,
  headline: "You're in a good place.",
  subtext: 'Your essentials are up to date.',
  checklist: [
    { id: 'chk-1', label: 'Water & food supply', done: true },
    { id: 'chk-2', label: 'First aid kit stocked', done: true },
    { id: 'chk-3', label: 'Family meeting point set', done: true },
    { id: 'chk-4', label: 'Emergency contacts saved', done: true },
    { id: 'chk-5', label: 'Go-bag packed', done: false },
    { id: 'chk-6', label: 'Home evacuation route reviewed', done: false },
  ],
  nextSteps: [
    { id: 'step-1', iconName: 'Droplets', title: 'Restock your water', detail: 'Aim for at least 3 liters per person per day, for 3 days.' },
    { id: 'step-2', iconName: 'BriefcaseMedical', title: 'Refresh your first aid kit', detail: 'Check expiry dates on medication and bandages.' },
    { id: 'step-3', iconName: 'Flashlight', title: 'Pack a go-bag', detail: 'Flashlight, batteries, chargers, documents, cash, medication.' },
    { id: 'step-4', iconName: 'Radio', title: 'Confirm how you get alerts', detail: 'Keep at least one battery-powered or hand-crank radio.' },
  ],
};
