// FOR MANUAL TESTING ONLY - not imported or used anywhere in the live
// app. Not wired into useAgroAIChat, on purpose: seeding these into
// the real, persisted chat flow would look exactly like "the AI is
// already responding," which is explicitly out of scope for this step.
//
// To visually verify all four card types render correctly, temporarily
// replace ChatArea's `messages` prop with this array during local
// testing, then revert - do not ship this wired in.
export const mockAgroAIMessages = [
  { id: 'mock-1', sender: 'user', text: 'My tomato leaves have yellow spots', status: 'sent' },
  {
    id: 'mock-2',
    sender: 'assistant',
    cardType: 'diagnosis',
    status: 'sent',
    cardData: {
      problem: 'Early blight',
      severity: 'Medium',
      suggestedAction: 'Spray Mancozeb, remove infected leaves',
      disclaimer: 'AI diagnosis - confirm with a local expert.',
      confidence: "I'm quite sure, based on your photo.",
      likelyCause: 'Humid conditions with poor leaf airflow',
      prevention: 'Space plants for airflow and avoid overhead watering',
    },
  },
  { id: 'mock-3', sender: 'user', text: "Today's onion price?", status: 'sent' },
  {
    id: 'mock-4',
    sender: 'assistant',
    cardType: 'marketPrice',
    status: 'sent',
    cardData: {
      cropName: 'Onion',
      marketName: 'Mandya APMC',
      location: 'Mandya, Karnataka',
      currentPrice: 2850,
      unit: 'Quintal',
      minPrice: 2700,
      maxPrice: 3000,
      lastUpdated: 'Today, 5:32 PM',
      trend: 'up',
      summary: 'Prices are up compared to last week.',
    },
  },
  { id: 'mock-5', sender: 'user', text: 'Will it rain today?', status: 'sent' },
  {
    id: 'mock-6',
    sender: 'assistant',
    cardType: 'weather',
    status: 'sent',
    cardData: {
      summary: 'Partly cloudy',
      temperature: '28°C',
      rainPrediction: 'Low chance',
      humidity: '65%',
      wind: '12 km/h',
      recommendation: 'Good day to spray - low chance of rain.',
    },
  },
  { id: 'mock-7', sender: 'user', text: 'I need fertilizer', status: 'sent' },
  {
    id: 'mock-8',
    sender: 'assistant',
    cardType: 'fertilizer',
    status: 'sent',
    cardData: {
      cropName: 'Tomato',
      growthStage: 'Flowering',
      fertilizerName: 'Balanced NPK (19:19:19)',
      quantity: '50 kg per acre',
      applicationMethod: 'Broadcast and mix into topsoil',
      applicationTime: 'Early morning or evening',
      precautions: 'Avoid application right before heavy rain',
      disclaimer: 'General guidance - adjust based on soil test results.',
    },
  },
];
