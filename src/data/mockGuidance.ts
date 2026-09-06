import { DisasterGuidance } from '@/types';

export const disasterTypes = [
  'Flood',
  'Earthquake',
  'Cyclone',
  'Fire',
  'Landslide',
  'Power failure',
  'Road blockage',
  'Medical emergency',
];

// Placeholder guidance content, standing in for what a RAG pipeline would
// retrieve + generate per disaster type. Shape matches `DisasterGuidance`
// exactly (including `sources` as RagSource objects) so swapping
// `guidanceService` to call a real endpoint requires no UI changes.
export const mockGuidanceByType: Record<string, DisasterGuidance> = {
  Flood: {
    disasterType: 'Flood',
    doThisNow: [
      'Move to higher ground immediately if water is rising near you.',
      'Turn off electricity and gas at the mains if it is safe to reach them.',
      'Avoid walking or driving through moving water, even shallow water.',
      'Keep your phone charged and share your location with a family member.',
    ],
    avoid: [
      'Do not walk through water if you cannot see the ground.',
      'Do not drive around barricades into a flooded road.',
      'Do not touch electrical equipment while standing in water.',
    ],
    why: 'Fast-moving water only 15 cm deep can knock over an adult, and 30 cm can carry away most vehicles. Floodwater can also hide downed power lines and contamination.',
    sources: [
      { id: 'ndma-flood', title: 'Flood Guidelines', publisher: 'NDMA' },
      { id: 'nws-flood', title: 'Flood Safety', publisher: 'National Weather Service' },
    ],
    confidence: 'high',
  },
  Earthquake: {
    disasterType: 'Earthquake',
    doThisNow: [
      'Drop, cover, and hold on under sturdy furniture until shaking stops.',
      'Stay away from windows, mirrors, and anything that could fall.',
      'If outdoors, move to an open area away from buildings and power lines.',
      'After shaking stops, check yourself and others for injuries before moving.',
    ],
    avoid: [
      'Do not run outside during shaking.',
      'Do not use elevators after an earthquake.',
      'Do not light matches or candles in case of gas leaks.',
    ],
    why: 'Most earthquake injuries happen from falling objects and collapsing furniture, not the shaking itself. Aftershocks can follow, sometimes minutes to days later.',
    sources: [
      { id: 'ndma-eq', title: 'Earthquake Guidelines', publisher: 'NDMA' },
      { id: 'usgs-eq', title: 'Earthquake Safety', publisher: 'USGS' },
    ],
    confidence: 'high',
  },
  Fire: {
    disasterType: 'Fire',
    doThisNow: [
      'Get low and get out — crawl under smoke if needed.',
      'Feel doors before opening; if hot, use another exit.',
      'Call emergency services once you are safely outside.',
      'Meet at your planned family meeting point.',
    ],
    avoid: ['Do not stop to gather belongings.', 'Do not use elevators.', 'Do not go back inside for any reason.'],
    why: 'Smoke inhalation, not flames, causes most fire deaths. Toxic gases rise, so staying low near the floor gives you more breathable air and more time to escape.',
    sources: [
      { id: 'ndma-fire', title: 'Fire Safety Guidelines', publisher: 'NDMA' },
      { id: 'nfpa-fire', title: 'Home Fire Safety', publisher: 'National Fire Protection Association' },
    ],
    confidence: 'high',
  },
  Cyclone: {
    disasterType: 'Cyclone',
    doThisNow: [
      'Move to the safest interior room, away from windows.',
      'Secure or bring in loose outdoor items.',
      'Keep emergency supplies and a charged phone within reach.',
      'Follow official evacuation orders without delay if issued.',
    ],
    avoid: [
      'Do not go outside during the eye of the storm — winds return suddenly.',
      'Do not drive through flooded or debris-covered roads.',
    ],
    why: 'Cyclones bring a temporary lull ("the eye") that can mislead people into thinking it has passed, right before winds return from the opposite direction.',
    sources: [
      { id: 'ndma-cyclone', title: 'Cyclone Guidelines', publisher: 'NDMA' },
      { id: 'imd-cyclone', title: 'Cyclone Warnings', publisher: 'India Meteorological Department' },
    ],
    confidence: 'medium',
  },
  Landslide: {
    disasterType: 'Landslide',
    doThisNow: [
      'Move away from the path of the slide, not downhill or along it.',
      'Listen for unusual sounds like cracking trees or rumbling.',
      'Alert neighbors if you notice ground movement or new cracks.',
      'Stay awake and alert during heavy, prolonged rainfall.',
    ],
    avoid: [
      'Do not return to the area until officials confirm it is safe.',
      'Do not linger near steep slopes after heavy rain.',
    ],
    why: 'Landslides can move faster than people can run, especially on steep terrain, so early movement away from the slope matters more than distance covered.',
    sources: [{ id: 'ndma-landslide', title: 'Landslide Guidelines', publisher: 'NDMA' }],
    confidence: 'medium',
  },
  'Power failure': {
    disasterType: 'Power failure',
    doThisNow: [
      'Turn off and unplug sensitive electronics to avoid surge damage.',
      'Use flashlights instead of candles where possible.',
      'Keep refrigerator and freezer doors closed to preserve food.',
      'Check on neighbors who may depend on powered medical equipment.',
    ],
    avoid: ['Do not use generators indoors or in enclosed spaces.', 'Do not open the fridge/freezer more than necessary.'],
    why: 'Extended outages put people who rely on powered medical devices at real risk, and generator exhaust causes carbon monoxide poisoning when used indoors.',
    sources: [{ id: 'ndma-power', title: 'Power Outage Guidelines', publisher: 'NDMA' }],
    confidence: 'medium',
  },
  'Road blockage': {
    disasterType: 'Road blockage',
    doThisNow: [
      'Avoid the blocked route and check updates before heading out.',
      'Report the blockage location clearly so others can be warned.',
      'If stuck, stay with your vehicle if it is safe to do so.',
    ],
    avoid: ['Do not attempt to drive around barriers on flooded or damaged roads.'],
    why: 'Road blockages are often placed because the road ahead is structurally unsafe, not just inconvenient.',
    sources: [{ id: 'local-traffic', title: 'Traffic advisory', publisher: 'Local traffic authority' }],
    confidence: 'low',
  },
  'Medical emergency': {
    disasterType: 'Medical emergency',
    doThisNow: [
      'Call emergency services (112) right away.',
      'Keep the person still and calm while help is on the way.',
      'If trained, provide first aid within your competence.',
      'Send someone to guide responders to the exact location.',
    ],
    avoid: [
      'Do not move someone with a suspected spinal injury unless there is immediate danger.',
      'Do not give food or water to an unconscious person.',
    ],
    why: 'The first few minutes of a medical emergency are the most critical for outcomes like cardiac arrest or severe bleeding — acting fast matters more than acting perfectly.',
    sources: [
      { id: 'ndma-firstaid', title: 'First Aid Guidelines', publisher: 'NDMA' },
      { id: 'redcross-firstaid', title: 'First Aid Basics', publisher: 'Red Cross' },
    ],
    confidence: 'high',
  },
  general: {
    disasterType: 'general',
    doThisNow: [
      'Move yourself and those nearby away from immediate danger.',
      'Contact emergency services if there is risk to life.',
      'Share your status and location with your emergency contacts.',
      'Follow instructions from local authorities as they arrive.',
    ],
    avoid: [
      'Do not put yourself at further risk to help with property.',
      'Do not rely on unverified information over official guidance.',
    ],
    why: 'Clear, early action and communication reduce the risk of secondary injuries and help responders prioritize where help is needed most.',
    sources: [{ id: 'ndma-general', title: 'General Preparedness Guidelines', publisher: 'NDMA' }],
    confidence: 'low',
  },
};
