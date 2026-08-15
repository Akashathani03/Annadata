import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { resolveImageUrl } from '../../utils/resolveImageUrl';
import { useToast } from '../../context/ToastContext';
import './PhotoUpload.css';

export default function PhotoUpload({ value, onChange, label, hint }) {
  const { t } = useTranslation(['listings']);
  const { showToast } = useToast();
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast(t('listings:create.photoTooLarge'));
      e.target.value = ''; // allow re-selecting the same (or a different) file immediately
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
      <div className={`photo-upload-box${value ? ' has-image' : ''}`} onClick={() => inputRef.current?.click()}>
        {value ? (
          <img src={resolveImageUrl(value)} alt="" className="photo-upload-preview" />
        ) : (
          <>
            <span className="photo-upload-icon">🖼️</span>
            <b>{label}</b>
            <span className="photo-upload-hint">{hint}</span>
          </>
        )}
      </div>
    </div>
  );
}
