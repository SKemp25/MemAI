import { useState } from 'react';
import { checkPin } from '../data/pinLock';
import './LockScreen.css';

export function LockScreen({ onUnlock }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pin.trim()) return;
    setChecking(true);
    try {
      const ok = await checkPin(pin);
      if (ok) {
        onUnlock();
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="lock-screen" role="dialog" aria-label="Unlock app">
      <div className="lock-screen-card">
        <h2 className="lock-screen-title">Unlock</h2>
        <p className="lock-screen-hint">Enter your PIN to open your data.</p>
        <form onSubmit={handleSubmit} className="lock-screen-form">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="lock-screen-input"
            aria-label="PIN"
            disabled={checking}
          />
          {error && <p className="lock-screen-error" role="alert">{error}</p>}
          <button type="submit" className="lock-screen-submit" disabled={!pin.trim() || checking}>
            {checking ? 'Checking…' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
