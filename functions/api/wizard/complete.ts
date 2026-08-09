/**
 * functions/api/wizard/complete.ts
 * -----------------------------------------------------------------------
 * Wizard final screen — "You're set up."
 *
 * PHASE D: this route was NOT in the pass-2 mockups (deliberately — the
 * mockup README lists it as conventional). It is built here because the
 * D1 migration change made it load-bearing:
 *
 *   >>> REVOCATION IS UNCONDITIONAL. <<<
 *   Roadmap §1.2 + Phase 6 revision 6 (lines ~77, ~104, ~547): Gate 1
 *   killed pass 2's Option B opt-in retention. There is no
 *   retain_google_access column and no "keep my access for support"
 *   branch. Completing the wizard ALWAYS revokes SecureProspective's
 *   own Drive grant and nulls the stored refresh token. The one
 *   exception is the support-repair re-authorization flow, which
 *   re-grants for the duration of one repair and revokes again on
 *   completion — it never sits in a "retained" state.
 *
 *   This is the correct behaviour even though it can feel backwards:
 *   a dead grant we cannot use is worse than no grant, because it sits
 *   on the agent's myaccount.google.com/permissions page forever,
 *   looking alarming and unexplained to a user who will be alarmed.
 *
 * STATUS: RUNNABLE STRUCTURE, live-account path UNTESTED.
 *   - Revocation is idempotent and safe to call repeatedly.
 *   - The live Google revoke round trip cannot run until Phase 0
 *     (live Google account). Marked UNTESTED accordingly.
 *
 * TOOLKIT T1: requireSession() is no longer a stand-in — it now comes
 * from the real _lib/session.ts (written in T1; it did not exist when
 * this route was scaffolded). json() is still a stand-in for the house
 * _lib/http.ts, which also carries the origin lock + JSON-CSRF check —
 * THIS route should use it once that module lands.
 */

import { revokeAndForget, type GoogleEnv } from '../../_lib/google-oauth';
import { requireSession } from '../../_lib/kit-session';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const onRequestPost: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  const now = Math.floor(Date.now() / 1000);

  // The one thing we refuse to do here is proceed without a completed
  // proof. The fire drill + setup-code round trip are the product's
  // safety spine; completing past them would be the silent-failure class
  // the whole design exists to avoid.
  const install = await env.KIT_DB.prepare(
    `SELECT verified_read_at, verified_write_at, drive_folder_id, drive_scope
       FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{
      verified_read_at: number | null;
      verified_write_at: number | null;
      drive_folder_id: string | null;
      drive_scope: string | null;
    }>();

  if (!install) return json({ error: 'no_install' }, 409);
  if (!install.verified_read_at) return json({ error: 'verify_read_pending', step: 'verify' }, 409);
  // R2's Gate 3: a server-provisioned Drive folder only exists on the
  // scoped path. The two delegated paths (native connector, local folder)
  // never run drive-provision.ts by design — Claude creates the folder
  // itself — so requiring drive_folder_id universally would make
  // 'complete' permanently unreachable for them. Only the path that
  // actually provisions one is held to having one.
  if (install.drive_scope === 'scoped' && !install.drive_folder_id) {
    return json({ error: 'not_provisioned', step: 'provision' }, 409);
  }

  // ---- Unconditional revocation --------------------------------------
  // revokeAndForget() already handles the correct order internally:
  // REVOKE FIRST against Google, THEN null the row. It returns whether
  // Google accepted the revocation; a false return is logged, because it
  // is the only signal that a live grant may have been orphaned. It is
  // not fatal — an already-dead token also fails here.
  let revoked: boolean;
  try {
    revoked = await revokeAndForget(env, session.userId);
  } catch (e) {
    // We must not complete while a live grant might still be sitting on
    // the agent's Google account. Fail closed.
    console.error('complete: revocation failed', e);
    return json({ error: 'revoke_failed', detail: 'we could not revoke our Google access. Do not close this screen — retry, or revoke at myaccount.google.com/permissions.' }, 500);
  }

  // ---- Finalize ------------------------------------------------------
  await env.KIT_DB.prepare(
    `UPDATE kit_installs
        SET step = 'complete', completed_at = ?, updated_at = ?
      WHERE user_id = ?`,
  )
    .bind(now, now, session.userId)
    .run();

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
     VALUES (?, ?, 'install.completed', ?)`,
  )
    .bind(session.userId, now, JSON.stringify({ revoked }))
    .run();

  return json({ ok: true, googleAccessRevoked: revoked });
};
