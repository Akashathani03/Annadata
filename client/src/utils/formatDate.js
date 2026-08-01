// Formats a date for display only. Never changes how dates are stored
// or passed between service/repository layers - those stay as ISO
// date strings (YYYY-MM-DD) or timestamps everywhere else.
//
// Example: '2026-07-29' -> '29 Jul 2026'
export function formatDisplayDate(dateInput, locale = 'en-IN') {
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return dateInput;

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
