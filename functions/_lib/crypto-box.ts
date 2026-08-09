/**
 * functions/_lib/crypto-box.ts
 * -----------------------------------------------------------------------
 * InsuranceAgentKit — authenticated encryption for Google refresh tokens.
 *
 * STATUS: MOCKUP. Never executed. No Cloudflare account, no D1, no live
 * test in the environment this was written in.
 *
 * CONFIDENT / STANDARD:
 *   * WebCrypto (crypto.subtle, crypto.getRandomValues) is native to the
 *     Cloudflare Workers runtime. No nodejs_compat flag, no npm package.
 *   * AES-GCM with a 12-byte random IV per record is the standard
 *     construction. 12 bytes is the value the spec is built around.
 *   * Never reusing an (key, IV) pair is the one rule you cannot break
 *     with GCM; a fresh random IV per encrypt satisfies it.
 *
 * NEEDS VERIFICATION:
 *   * Nothing exotic here, but run the round-trip test at the bottom of
 *     this file against a real Worker before trusting it with a token.
 *
 * WHAT THIS DOES AND DOES NOT PROTECT — be honest about this in any
 * user-facing security page:
 *   PROTECTS AGAINST: exposure of the DATABASE. D1 dumps, backups,
 *     SQL injection, a misdirected export, a stolen read credential.
 *   DOES NOT PROTECT AGAINST: compromise of the Worker itself, which by
 *     construction holds both the ciphertext and the key. The real
 *     mitigation for that is not storing tokens at all after the wizard
 *     completes — see §2.7 Option A in the findings doc.
 */

export interface CryptoEnv {
  /** base64 of 32 random bytes. Cloudflare dashboard secret, per env.
   *  Generate with:  openssl rand -base64 32                          */
  KIT_TOKEN_KEY: string;
}

const VERSION = 'v1';
const IV_BYTES = 12;

/* ---------------------------------------------------------------- */
/* base64url helpers — Workers has atob/btoa but not base64url        */
/* ---------------------------------------------------------------- */

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '='));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64Decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/* ---------------------------------------------------------------- */

let cachedKey: CryptoKey | null = null;

async function importKey(env: CryptoEnv): Promise<CryptoKey> {
  // Safe to cache on the module scope: it is derived from an immutable
  // env secret and is per-isolate. If the secret is rotated, isolates
  // recycle within minutes.
  if (cachedKey) return cachedKey;

  const raw = b64Decode(env.KIT_TOKEN_KEY);
  if (raw.length !== 32) {
    throw new Error('KIT_TOKEN_KEY must decode to exactly 32 bytes (AES-256)');
  }
  cachedKey = await crypto.subtle.importKey(
    'raw',
    raw,
    { name: 'AES-GCM' },
    false,               // not extractable
    ['encrypt', 'decrypt'],
  );
  return cachedKey;
}

/**
 * Seal a secret string.
 *
 * `aad` MUST be the owning user_id. This cryptographically binds the
 * ciphertext to its row: an attacker with WRITE access to D1 cannot move
 * one user's token into another user's row and have it decrypt. Without
 * the AAD, that swap succeeds silently and hands them someone else's
 * Drive. This is the single most valuable line in this file.
 *
 * @returns 'v1.<iv_b64url>.<ciphertext_b64url>'
 */
export async function seal(
  env: CryptoEnv,
  plaintext: string,
  aad: string,
): Promise<string> {
  const key = await importKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const ct = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(aad),
    },
    key,
    new TextEncoder().encode(plaintext),
  );

  return [VERSION, b64urlEncode(iv), b64urlEncode(new Uint8Array(ct))].join('.');
}

/**
 * Open a sealed string. Throws if the ciphertext was tampered with, if
 * the key is wrong, or if `aad` does not match what it was sealed with.
 *
 * Callers should treat a throw as "this token is gone" and route the
 * user back through the Connect Google screen — NOT as a 500. A dead
 * token is an expected state in this product, not an exceptional one.
 */
export async function open(
  env: CryptoEnv,
  sealed: string,
  aad: string,
): Promise<string> {
  const parts = sealed.split('.');
  if (parts.length !== 3 || parts[0] !== VERSION) {
    throw new Error('crypto-box: unrecognized sealed format');
  }
  const key = await importKey(env);
  const iv = b64urlDecode(parts[1]);
  const ct = b64urlDecode(parts[2]);

  const pt = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
      additionalData: new TextEncoder().encode(aad),
    },
    key,
    ct,
  );
  return new TextDecoder().decode(pt);
}

/* ---------------------------------------------------------------- */
/* Small helpers used by the OAuth routes                            */
/* ---------------------------------------------------------------- */

/** Cryptographically random URL-safe token. NEVER Math.random(). */
export function randomToken(bytes = 32): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** Hex sha256. Mirrors sha256Hex() in the existing _lib/password.ts —
 *  if that helper is exported, import it instead of duplicating. */
export async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/* ---------------------------------------------------------------- */
/* Round-trip check to run once in a real Worker before shipping.    */
/* ---------------------------------------------------------------- */
/*
  const sealed = await seal(env, 'refresh-token-abc', 'user_123');
  console.log(await open(env, sealed, 'user_123'));   // 'refresh-token-abc'
  try {
    await open(env, sealed, 'user_456');              // MUST throw
    throw new Error('AAD binding is not working — do not ship');
  } catch { /* expected *\/ }
*/
