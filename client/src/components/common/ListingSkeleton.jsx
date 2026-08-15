/*
 * Loading placeholder for the Buy listing lists.
 *
 * Deliberately mirrors the shape of a real listing row (thumbnail +
 * two text lines) rather than showing a centered icon and message -
 * the previous approach was visually identical to the empty state,
 * so a farmer couldn't tell "still loading" from "nothing found".
 *
 * Styles live in Crops/BuyCrops/BuyCrops.css, which all three Buy
 * screens already import - no new stylesheet needed.
 */
export default function ListingSkeleton({ count = 3 }) {
  return (
    <div className="bc-skeleton-list" aria-busy="true" aria-live="polite">
      {Array.from({ length: count }).map((_, i) => (
        <div className="bc-skeleton-card" key={i}>
          <div className="bc-skeleton-thumb" />
          <div className="bc-skeleton-lines">
            <div className="bc-skeleton-line" />
            <div className="bc-skeleton-line short" />
          </div>
        </div>
      ))}
    </div>
  );
}
