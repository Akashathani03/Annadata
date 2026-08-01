// One entry per locked Quick Action. `handlerType` mirrors the PDS's
// intent categories (lookup vs generate) so the eventual chat-logic
// hook can branch on it without hardcoding four separate cases.
export const agroAIQuickActions = [
  { id: 'weather', icon: 'cloud', labelKey: 'agroAI:quickActions.weather', handlerType: 'lookup' },
  { id: 'fertilizer', icon: 'droplet', labelKey: 'agroAI:quickActions.fertilizer', handlerType: 'generate' },
  { id: 'disease', icon: 'bug', labelKey: 'agroAI:quickActions.disease', handlerType: 'generate' },
  { id: 'marketPrice', icon: 'currency-rupee', labelKey: 'agroAI:quickActions.marketPrice', handlerType: 'lookup' },
];
