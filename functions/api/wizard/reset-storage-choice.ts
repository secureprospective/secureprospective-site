/**
 * functions/api/wizard/reset-storage-choice.ts
 * -----------------------------------------------------------------------
 * The reversal `set-storage-mode.ts`'s own header flagged as unscoped:
 * "switching storage location after commitment is a real product question
 * ... the safe default is to refuse rather than guess at reversal
 * semantics nobody has decided." Christopher decided it, live, after
 * testing the wizard himself: an agent who picked wrong on screen 2 had no
 * way back — "trapped in a decision and no way to reverse it."
 *
 * WHAT THIS ROUTE DOES: undoes screen 2's choice and everything that
 * choice unlocked, rolling `step` back to 'profile_saved' so
 * ConnectGoogleStep renders the real three-way picker again instead of a
 * settled view. It does NOT touch profile fields (screen 1) or delete
 * anything already created in Drive/locally — Claude-created files are
 * not ours to delete, and a stray folder from an abandoned choice is a
 * far smaller problem than an agent unable to escape a bad pick.
 *
 * SCOPED PATH GETS THE SAME GATE 1 REVOCATION AS FINISHING DOES: if the
 * agent had granted SecureProspective's own drive.file access, this route
 * hands it back before clearing the row, for the same reason
 * complete.ts's own header gives — an orphaned live grant is worse than
 * no grant. Fails CLOSED on a revoke error (same as complete.ts): better
 * to ask him to retry than to silently strand our own access.
 *
 * ONLY REACHABLE BEFORE COMPLETION. Once `step = 'complete'`, this is the
 * wrong tool — the back-office standing control (capability-state.ts /
 * capability-toggle.ts) is the one built for a finished install, and it
 * does not attempt to re-litigate which storage mode was chosen.
 */

import { revokeAndForget, type GoogleEnv } from '../../_lib/google-oauth';
import { requireSession } from '../../_lib/kit-session';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

const RESETTABLE_STEPS = [
  'google_connected',
  'storage_chosen',
  'provisioned',
  'handoff_ack',
  'verified_read',
  'verified_write',
];

export const onRequestPost: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  const install = await env.KIT_DB.prepare(
    `SELECT step, drive_scope FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{ step: string; drive_scope: string | null }>();

  if (!install) return json({ error: 'no_install' }, 409);

  if (install.step === 'complete') {
    // Not this route's job — see the header. The back-office card is
    // where a finished install's Google connection gets managed.
    return json({ error: 'already_complete' }, 409);
  }

  if (!RESETTABLE_STEPS.includes(install.step)) {
    // 'registered' / 'profile_saved' — screen 2 has not been answered
    // yet, nothing to undo.
    return json({ error: 'nothing_to_reset' }, 409);
  }

  const now = Math.floor(Date.now() / 1000);

  if (install.drive_scope === 'scoped') {
    let revoked: boolean;
    try {
      revoked = await revokeAndForget(env, session.userId);
    } catch (e) {
      console.error('reset-storage-choice: revocation failed', e);
      return json(
        {
          error: 'revoke_failed',
          detail: 'we could not hand back our own Google access. Do not close this screen — retry, or revoke at myaccount.google.com/permissions first.',
        },
        500,
      );
    }
    await env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
       VALUES (?, ?, 'storage_choice.reset', ?)`,
    )
      .bind(session.userId, now, JSON.stringify({ previous_step: install.step, previous_storage: 'scoped', revoked }))
      .run();
  } else {
    await env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
       VALUES (?, ?, 'storage_choice.reset', ?)`,
    )
      .bind(session.userId, now, JSON.stringify({ previous_step: install.step, previous_storage: install.drive_scope ? 'delegated' : null, revoked: null }))
      .run();
  }

  // Clear everything screen 2's choice unlocked so re-choosing starts
  // clean: capability state, the delegated paths' self-report proof, the
  // scoped path's provisioning + code-proof state, and both write-check
  // outcomes — a re-chosen path must re-earn all of it, not inherit stale
  // proof from a different storage mode.
  await env.KIT_DB.prepare(
    `UPDATE kit_installs
        SET storage_location = NULL,
            drive_scope = NULL,
            gmail_connected = 0,
            calendar_connected = 0,
            setup_code = NULL,
            setup_code_attempts = 0,
            drive_folder_id = NULL,
            drive_folder_url = NULL,
            drive_folder_name = NULL,
            provisioned_at = NULL,
            verified_read_at = NULL,
            verified_write_at = NULL,
            step = 'profile_saved',
            updated_at = ?
      WHERE user_id = ?`,
  )
    .bind(now, session.userId)
    .run();

  return json({ ok: true });
};
