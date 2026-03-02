const PIN_HASH_KEY = 'chatgpt-convo-tracker-pin-hash';

async function hashPin(pin) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(String(pin))
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getPinHash() {
  return localStorage.getItem(PIN_HASH_KEY);
}

export function hasPin() {
  return !!getPinHash();
}

export async function setPin(pin) {
  const hash = await hashPin(pin.trim());
  localStorage.setItem(PIN_HASH_KEY, hash);
}

export function clearPin() {
  localStorage.removeItem(PIN_HASH_KEY);
}

export async function checkPin(pin) {
  const stored = getPinHash();
  if (!stored) return true;
  const hash = await hashPin(pin.trim());
  return hash === stored;
}
