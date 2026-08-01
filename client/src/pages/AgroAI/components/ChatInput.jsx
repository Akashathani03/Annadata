import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IconCamera, IconSend } from '../../../components/icons';
import './ChatInput.css';

// Still fully self-contained and decoupled from chat state (per Step 4
// scope) - the only addition here is resolving its own aria-label text
// via the shared localization system, same as every other component.
export default function ChatInput({
  onSend,
  onCameraClick,
  placeholder,
  disabled = false,
  maxLength,
}) {
  const { t } = useTranslation(['agroAI']);
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  const isEmpty = text.trim().length === 0;
  const canSend = !isEmpty && !disabled;

  function resetHeight(el) {
    // Auto-grow: measure natural content height, let CSS max-height
    // (see ChatInput.css) cap it and switch to internal scrolling once
    // the cap is reached - no JS-side max-height duplication needed.
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  function handleChange(e) {
    setText(e.target.value);
    resetHeight(e.target);
  }

  function handleSend() {
    if (!canSend) return;
    onSend(text.trim());
    setText('');
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.focus();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter is native textarea behavior (inserts a newline) -
    // nothing to do here, just don't intercept it.
  }

  return (
    <div className="chat-input">
      <button
        type="button"
        className="chat-input-camera-btn"
        onClick={onCameraClick}
        disabled={disabled}
        aria-label={t('agroAI:input.cameraAriaLabel')}
      >
        <IconCamera size={20} strokeWidth={2} />
      </button>

      <textarea
        ref={textareaRef}
        className="chat-input-textarea"
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={1}
        aria-label={placeholder}
      />

      <button
        type="button"
        className="chat-input-send-btn"
        onClick={handleSend}
        disabled={!canSend}
        aria-label={t('agroAI:input.sendAriaLabel')}
      >
        <IconSend size={19} strokeWidth={2} />
      </button>
    </div>
  );
}
