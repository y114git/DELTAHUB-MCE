export function generateSecretKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 14; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RUNE-${randomPart}`;
}

export async function hashSecretKey(secretKey) {
  const encoder = new TextEncoder();
  const data = encoder.encode(secretKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

