/**
 * PIN hashing for the quick-unlock passcode.
 * The PIN itself is never stored; only a salted PBKDF2-SHA-256 hash is saved.
 */

const ITERATIONS = 210_000;

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function derive(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toBase64(new Uint8Array(bits));
}

export async function hashPin(pin: string): Promise<{ pin_hash: string; pin_salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { pin_hash: await derive(pin, salt), pin_salt: toBase64(salt) };
}

export async function verifyPin(pin: string, pinHash: string, pinSalt: string): Promise<boolean> {
  return (await derive(pin, fromBase64(pinSalt))) === pinHash;
}
