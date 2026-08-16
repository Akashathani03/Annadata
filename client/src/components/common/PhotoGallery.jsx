import { resolveImageUrl } from '../../utils/resolveImageUrl';
import './PhotoGallery.css';

// Drops into the exact hero box every Detail page already has
// (className is the caller's own existing hero class - e.g.
// "bc-detail-hero" on Buy pages, "ld-hero" on a seller's own listing
// view - so sizing/background/border-radius are unchanged whether a
// listing has one photo or four). children renders on top of the
// gallery (the status badge on ld-hero), same as before.
export default function PhotoGallery({ photoUrls, className, fallback, children }) {
  const photos = photoUrls || [];

  return (
    <div className={className}>
      {photos.length > 0 ? (
        <div className="photo-gallery-scroll">
          {photos.map((url, index) => (
            <img key={index} src={resolveImageUrl(url)} alt="" />
          ))}
        </div>
      ) : (
        fallback
      )}

      {photos.length > 1 && (
        <span className="photo-gallery-count">📷 {photos.length}</span>
      )}

      {children}
    </div>
  );
}
