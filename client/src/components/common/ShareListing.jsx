import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../context/ToastContext';
import { IconShare } from '../icons';
import BottomSheet from './BottomSheet';
import './ShareListing.css';

// url: the existing public Detail page URL (e.g. /buy/:id), already
// resolved to a full, absolute link by the caller. title: plain listing
// name only - this component never receives or touches phone, ownerId,
// or any other field, so there is no path for private data to leak
// into a shared message.
export default function ShareListing({ url, title }) {
  const { t } = useTranslation(['buyCrops']);
  const { showToast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);

  const shareText = t('detail.shareMessage', { title });

  async function handleShareClick() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareText,
          url,
        });
      } catch {
        // User cancelled the native share sheet, or it failed silently.
      }
      return;
    }

    setSheetOpen(true);
  }

  function handleWhatsAppShare() {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `${shareText} ${url}`
    )}`;

    window.open(whatsappUrl, '_blank', 'noreferrer');
    setSheetOpen(false);
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url);
      showToast(t('detail.linkCopied'));
    } catch {
      showToast(t('detail.copyLinkFailed'));
    }

    setSheetOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="share-listing-btn"
        onClick={handleShareClick}
      >
        <IconShare size={15} strokeWidth={2} />
        {t('detail.share')}
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      >
        <h3 className="share-sheet-title">
          {t('detail.shareSheetTitle')}
        </h3>

        <button
          type="button"
          className="share-option-btn"
          onClick={handleWhatsAppShare}
        >
          💬 {t('detail.shareViaWhatsapp')}
        </button>

        <button
          type="button"
          className="share-option-btn"
          onClick={handleCopyLink}
        >
          🔗 {t('detail.copyLink')}
        </button>
      </BottomSheet>
    </>
  );
}