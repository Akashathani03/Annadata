import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import BottomSheet from './BottomSheet';
import './LocationSuggestInput.css';

// A tap-to-open picker: shows the current value as a field, and on
// tap opens a full BottomSheet with a search box and the option list.
//
// Deliberately NOT an inline dropdown (native <datalist> or a custom
// absolutely-positioned list): both broke on mobile inside the
// BottomSheet forms this is used in - `overflow: auto` on the
// scrollable sheet clips any inline dropdown that opens near the
// bottom of the form, and native <datalist> filters its suggestions
// to match whatever's already typed, hiding everything but the
// field's current value. A dedicated sheet sidesteps both: it's not
// nested inside another scroll container, and it always lists every
// option regardless of the field's current value.
//
// Options are usually a static array (`options`), but for cases like
// Village - where suggestions have to be looked up live per selected
// taluk rather than bundled - pass `fetchOptions` (a () => Promise
// <string[]>) instead; it's called once per opening and its result is
// shown once resolved. Either way, typing a value not in the list is
// always accepted (`useTypedValue`), since no source here is ever
// guaranteed complete.
export default function LocationSuggestInput({
  value,
  onChange,
  options,
  fetchOptions,
  placeholder,
  label,
}) {
  const { t } = useTranslation(['common']);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loadedOptions, setLoadedOptions] = useState(null);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);

  const resolvedOptions = fetchOptions ? loadedOptions || [] : options;

  const trimmedQuery = query.trim();

  const filtered = trimmedQuery
    ? resolvedOptions.filter((opt) =>
        opt.toLowerCase().includes(trimmedQuery.toLowerCase())
      )
    : resolvedOptions;

  const exactMatch = resolvedOptions.some(
    (opt) => opt.toLowerCase() === trimmedQuery.toLowerCase()
  );

  function openPicker() {
    setQuery('');
    setOpen(true);

    if (fetchOptions) {
      const requestId = ++requestIdRef.current;
      setLoadedOptions(null);
      setLoading(true);

      fetchOptions()
        .then((result) => {
          if (requestIdRef.current !== requestId) return;
          setLoadedOptions(Array.isArray(result) ? result : []);
        })
        .catch(() => {
          if (requestIdRef.current !== requestId) return;
          setLoadedOptions([]);
        })
        .finally(() => {
          if (requestIdRef.current !== requestId) return;
          setLoading(false);
        });
    }
  }

  function closePicker() {
    setOpen(false);
  }

  function selectOption(opt) {
    onChange(opt);
    closePicker();
  }

  function useTypedValue() {
    if (trimmedQuery) onChange(trimmedQuery);
    closePicker();
  }

  return (
    <>
      <button
        type="button"
        className="loc-suggest-field"
        onClick={openPicker}
      >
        <span
          className={
            value
              ? 'loc-suggest-value'
              : 'loc-suggest-placeholder'
          }
        >
          {value || placeholder || '—'}
        </span>
        <span className="loc-suggest-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      <BottomSheet open={open} onClose={closePicker}>
        <h3 className="loc-suggest-sheet-title">
          {label || t('common:selectValue', { field: '' })}
        </h3>

        <input
          type="text"
          className="loc-suggest-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus
          autoComplete="off"
        />

        <div className="loc-suggest-options">
          {trimmedQuery && !exactMatch && (
            <button
              type="button"
              className="loc-suggest-option loc-suggest-option-custom"
              onClick={useTypedValue}
            >
              {t('common:useTypedValue', { value: trimmedQuery })}
            </button>
          )}

          {loading && (
            <div className="loc-suggest-empty">
              {t('common:loadingSuggestions')}
            </div>
          )}

          {!loading &&
            filtered.map((opt) => (
              <button
                type="button"
                key={opt}
                className={`loc-suggest-option${
                  opt === value ? ' active' : ''
                }`}
                onClick={() => selectOption(opt)}
              >
                {opt}
              </button>
            ))}

          {!loading && filtered.length === 0 && (
            <div className="loc-suggest-empty">
              {t('common:noMatchesTypeToSearch')}
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}
