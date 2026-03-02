import { useState } from 'react';
import './ThemeSwitcher.css';

const PALETTES = [
  { id: 'default', name: 'Chill', description: 'Teal and stone' },
  { id: 'warm', name: 'Warm', description: 'Amber and cream' },
  { id: 'high-contrast', name: 'High contrast', description: 'Clear and bold' },
];

export function ThemeSwitcher({ theme, onThemeChange, customAccent, onCustomAccentChange }) {
  const [open, setOpen] = useState(false);

  const handleCustomColorChange = (e) => {
    const hex = e.target.value;
    onCustomAccentChange?.(hex);
    onThemeChange?.('custom');
  };

  return (
    <div className={`theme-switcher ${open ? 'theme-switcher-open' : ''}`} role="group" aria-label="Color palette">
      <button
        type="button"
        className="theme-switcher-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="theme-switcher-current">Color Palette</span>
        <span className="theme-switcher-chevron" aria-hidden>{open ? '▼' : '▶'}</span>
      </button>
      {open && (
        <div className="theme-switcher-options">
          {PALETTES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`theme-option ${theme === p.id ? 'active' : ''}`}
              onClick={() => {
                onThemeChange(p.id);
                setOpen(false);
              }}
              title={p.description}
              aria-pressed={theme === p.id}
            >
              <span className="theme-option-name">{p.name}</span>
            </button>
          ))}
          <div className="theme-custom-row">
            <button
              type="button"
              className={`theme-option ${theme === 'custom' ? 'active' : ''}`}
              onClick={() => onThemeChange('custom')}
              title="Use your own accent color"
              aria-pressed={theme === 'custom'}
            >
              <span className="theme-option-name">Custom</span>
            </button>
            <label className="theme-color-picker-label">
              <span className="sr-only">Pick accent color</span>
              <input
                type="color"
                value={customAccent || '#0d9488'}
                onChange={handleCustomColorChange}
                className="theme-color-input"
                aria-label="Accent color"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
