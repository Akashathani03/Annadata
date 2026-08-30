import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from '../../../components/common/BottomSheet';
import { IconCamera, IconPhoto, IconClose, IconRefresh, IconSend } from '../../../components/icons';
import './ImageUploadSheet.css';

// Two internal stages: 'chooser' (Camera/Gallery, exactly per
// requirement 2 - no Files, no Voice) and 'preview' (image + optional
// caption + Cancel/Retake/Send). Reuses the shared BottomSheet
// component rather than a new page, per requirement 1.
//
// File reading uses the same FileReader.readAsDataURL approach as the
// existing PhotoUpload component, but PhotoUpload itself isn't reused
// here - it's a single-tap file picker with no Camera/Gallery choice
// and no preview/caption flow, the wrong shape for this design.
//
// Image handling is isolated to this one component (onSend receives
// the final { photoUrl, caption } pair) so swapping the data URL
// approach for real upload/backend logic later only touches this file.
export default function ImageUploadSheet({ open, onClose, onSend }) {
  const { t } = useTranslation(['agroAI']);
  const [stage, setStage] = useState('chooser');
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [caption, setCaption] = useState('');
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  function resetState() {
    setStage('chooser');
    setImageDataUrl(null);
    setCaption('');
  }

  function readFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result);
      setStage('preview');
    };
    reader.readAsDataURL(file);
  }

  function handleClose() {
    resetState();
    onClose?.();
  }

  function handleRetake() {
    setImageDataUrl(null);
    setCaption('');
    setStage('chooser');
  }

  function handleSend() {
    onSend?.({ photoUrl: imageDataUrl, caption: caption.trim() });
    resetState();
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      {stage === 'chooser' && (
        <>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => readFile(e.target.files?.[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => readFile(e.target.files?.[0])}
          />
          <div className="image-upload-chooser-header">
            <h3 className="image-upload-chooser-title">
              {t('agroAI:imageUpload.title')}
            </h3>

            <button
              type="button"
              className="image-upload-chooser-close"
              onClick={handleClose}
              aria-label={t('agroAI:imageUpload.cancelAriaLabel')}
            >
              <IconClose size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div className="image-upload-chooser">
            <button
              type="button"
              className="image-upload-choice"
              onClick={() => cameraInputRef.current?.click()}
            >
              <span className="image-upload-choice-icon">
                <IconCamera size={26} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>{t('agroAI:imageUpload.camera')}</span>
            </button>
            <button
              type="button"
              className="image-upload-choice"
              onClick={() => galleryInputRef.current?.click()}
            >
              <span className="image-upload-choice-icon">
                <IconPhoto size={26} strokeWidth={2} aria-hidden="true" />
              </span>
              <span>{t('agroAI:imageUpload.gallery')}</span>
            </button>
          </div>
        </>
      )}

      {stage === 'preview' && (
        <div className="image-upload-preview">
          <button
            type="button"
            className="image-upload-cancel-btn"
            onClick={handleClose}
            aria-label={t('agroAI:imageUpload.cancelAriaLabel')}
          >
            <IconClose size={14} strokeWidth={2} aria-hidden="true" />
          </button>

          <div className="image-upload-preview-frame">
            <img src={imageDataUrl} alt={t('agroAI:imageUpload.previewAlt')} />
          </div>

          <textarea
            className="image-upload-caption"
            placeholder={t('agroAI:imageUpload.captionPlaceholder')}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={1}
            aria-label={t('agroAI:imageUpload.captionPlaceholder')}
          />

          <div className="image-upload-actions">
            <button type="button" className="image-upload-retake-btn" onClick={handleRetake}>
              <IconRefresh size={15} strokeWidth={2} aria-hidden="true" />
              {t('agroAI:imageUpload.retake')}
            </button>
            <button type="button" className="image-upload-send-btn" onClick={handleSend}>
              <IconSend size={15} strokeWidth={2} aria-hidden="true" />
              {t('agroAI:imageUpload.send')}
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
