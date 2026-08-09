/**
 * functions/_lib/dev-bypass.ts
 * -----------------------------------------------------------------------
 * Lets the Google-connect and Drive-provision steps be exercised for
 * real (real D1 writes, real state transitions, real screen navigation)
 * on Cloudflare Preview deployments, without a real Google Cloud OAuth
 * client existing yet. Added 2026-08-09 when the wizard was first
 * deployed for real and Christopher chose "verify the mechanics now,
 * real Google OAuth is Phase 0's job later" over creating live Google
 * credentials before either was proven.
 *
 * ================ WHY THIS CANNOT FIRE IN PRODUCTION ==================
 * Gated on `CF_PAGES_BRANCH`, which Cloudflare Pages injects into every
 * Functions invocation automatically — it is not a secret anyone sets,
 * cannot be forgotten-unset, and is never `'main'` on a Preview
 * deployment. There is no environment variable to leave behind, no
 * secret to rotate, nothing to forget to remove before Production goes
 * live. When Production's own GOOGLE_CLIENT_ID/SECRET get added later,
 * this file does not need to change or be deleted — it already can't
 * fire there.
 * ========================================================================
 *
 * Do not widen this check to also accept an env var/flag. The entire
 * safety property is that there is nothing to set and nothing to unset.
 */

export interface DevBypassEnv {
  CF_PAGES_BRANCH?: string;
}

export function isDevBypass(env: DevBypassEnv): boolean {
  return typeof env.CF_PAGES_BRANCH === 'string' && env.CF_PAGES_BRANCH !== 'main';
}
