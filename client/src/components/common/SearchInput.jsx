import { IconSearch } from '../icons';
import './SearchInput.css';

export default function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="ui-search-wrap">
      <IconSearch className="ui-search-icon" size={17} strokeWidth={2} />
      <input
        className="ui-search-input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
