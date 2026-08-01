import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatInput from './ChatInput';
import ImageUploadSheet from './ImageUploadSheet';
import './InputArea.css';

export default function InputArea({ onSend, onSendImage }) {
  const { t } = useTranslation(['agroAI']);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);

  function handleImageSend({ photoUrl, caption }) {
    onSendImage?.({ photoUrl, caption });
    setUploadSheetOpen(false);
  }

  return (
    <div className="agroai-input-area">
      <ChatInput
        placeholder={t('agroAI:input.placeholder')}
        onSend={onSend}
        onCameraClick={() => setUploadSheetOpen(true)}
      />

      <ImageUploadSheet
        open={uploadSheetOpen}
        onClose={() => setUploadSheetOpen(false)}
        onSend={handleImageSend}
      />
    </div>
  );
}
