import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from './BottomSheet';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useToast } from '../../context/ToastContext';
import { IconCamera, IconPhoto, IconClose } from '../icons';
import './MultiPhotoUpload.css';

const MAX_FILE_BYTES = 8 * 1024 * 1024; // matches the server's real limit (routes/listings.routes.js)

// Camera/Gallery chooser, same shape as Agro AI's ImageUploadSheet
// (two plain <input type="file"> triggers, one with capture="environment")
// - but simpler, since a listing photo needs no caption/retake step:
// the grid below already lets a farmer see what they added and remove
// it, so there's nothing a separate preview stage would add.
//
// `values` is an array of image sources (fresh captures are data URLs
// from FileReader, an edited listing's existing photos are already
// real URLs) - same dual-shape convention PhotoUpload/ListingSuggest
// already use elsewhere, so listingsService's existing
// "data: URL means new, otherwise existing" upload logic needs no
// new concept, just the same rule applied per-item instead of once.
export default function MultiPhotoUpload({ values, onChange, max = 4, label, hint }) {
  const { t } = useTranslation(['listings']);
  const { showToast } = useToast();
  const [chooserOpen, setChooserOpen] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const photos = values || [];
  const canAddMore = photos.length < max;

  function openChooser() {
    if (!canAddMore) return;
    setChooserOpen(true);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file immediately
    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
      showToast(t('listings:create.photoTooLarge'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange([...photos, reader.result]);
      setChooserOpen(false);
    };
    reader.readAsDataURL(file);
  }

  function removePhoto(index) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div className="multi-photo-grid">
        {photos.map((src, index) => (
          <div className="multi-photo-tile" key={index}>
            <img src={resolveImageUrl(src)} alt="" />
            <button
              type="button"
              className="multi-photo-remove"
              onClick={() => removePhoto(index)}
              aria-label={t('listings:create.removePhoto')}
            >
              <IconClose size={12} strokeWidth={2.5} />
            </button>
            {index === 0 && (
              <span className="multi-photo-primary-tag">
                {t('listings:create.primaryPhoto')}
              </span>
            )}
          </div>
        ))}

        {canAddMore && (
          <button
            type="button"
            className="multi-photo-add"
            onClick={openChooser}
          >
            <span className="multi-photo-add-icon">🖼️</span>
            <b>{label}</b>
            {hint && <span className="multi-photo-add-hint">{hint}</span>}
          </button>
        )}
      </div>

      <span className="multi-photo-count">
        {t('listings:create.photoCount', { count: photos.length, max })}
      </span>

      <BottomSheet open={chooserOpen} onClose={() => setChooserOpen(false)}>
        <h3 className="multi-photo-sheet-title">
          {t('listings:create.uploadImage')}
        </h3>

        <div className="multi-photo-chooser">
          <button
            type="button"
            className="multi-photo-choice"
            onClick={() => cameraInputRef.current?.click()}
          >
            <IconCamera size={22} strokeWidth={2} aria-hidden="true" />
            <span>{t('listings:create.camera')}</span>
          </button>

          <button
            type="button"
            className="multi-photo-choice"
            onClick={() => galleryInputRef.current?.click()}
          >
            <IconPhoto size={22} strokeWidth={2} aria-hidden="true" />
            <span>{t('listings:create.gallery')}</span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
