// Formats a date for display only. Never changes how dates are stored
// or passed between service/repository layers - those stay as ISO
// date strings (YYYY-MM-DD) or timestamps everywhere else.
//
// Example: '2026-07-29' -> '29 Jul 2026'
//
// Used for history, sales records, and official records (per the
// approved date policy) - kept exactly as it was.
export function formatDisplayDate(dateInput, locale = 'en-IN') {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return dateInput;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

// The one global rule for listings, feeds, and browse cards (per the
// approved date policy) - deliberately coarse granularity (Today/
// Yesterday/N days ago), not minutes/hours, since "how recent is
// this listing" is the only real question a farmer or buyer has.
// History, sales records, and official records use formatDisplayDate
// above instead, unchanged - this function is not a replacement for
// that, it's a second, distinct rule for a distinct context.
export function formatRelativeTime(dateInput) {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((startOfToday - new Date(date).setHours(0, 0, 0, 0)) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
}
