import { useRef } from 'react';
import './PhotoUpload.css';

export default function PhotoUpload({ value, onChange, label, hint }) {
  const inputRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
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
          <img src={value} alt="" className="photo-upload-preview" />
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
