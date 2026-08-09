/**
 * functions/api/wizard/capability-state.ts
 * -----------------------------------------------------------------------
 * R6(c) — the back-office read path onto a member's KIT_DB capability
 * state (which storage path he chose at wizard screen 2, whether Gmail/
 * Calendar are on), so the standing off-switch card (and, later, the
 * "Update" button described in the InsuranceAgentKit brief §8) can render
 * and act correctly per-install instead of assuming one path.
 *
 * NOT a new API boundary between KIT_DB and BACKOFFICE_DB — reuses
 * `bridge.ts`'s exact pattern: verify a real BACKOFFICE_DB session, derive
 * the SAME stable KIT_DB user id (`sha256Hex('backoffice:' + member.id)`)
 * bridge.ts already uses to mint that member's kit session, then read
 * `kit_installs` directly with it. Never crosses a raw identifier between
 * the two databases, same as bridge.ts.
 *
 * ⚠️ Depends on migrations 0003 (capability-state columns) and 0004 (the
 * `storage_chosen` step value) landing in THIS repo's own migration
 * sequence — as of 2026-08-09 they exist only in the InsuranceAgentKit
 * source repo (`wizard/migrations/`), not yet merged/renumbered into
 * `secureprospective`'s `migrations/` (see WIZARD_RESHAPE_TASKS.md's R6
 * resume note for the numbering collision this merge will need to
 * resolve). Querying these columns against the live KIT_DB before that
 * merge lands will fail with `no such column` — expected, not a bug in
 * this file, and flagged rather than silently worked around.
 */

import { getSession, sessionHashFromRequest } from '../../_lib/session';
import { sha256Hex } from '../../_lib/crypto-box';

interface CapabilityStateEnv {
  BACKOFFICE_DB: D1Database;
  KIT_DB: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export const onRequestGet: PagesFunction<CapabilityStateEnv> = async ({ request, env }) => {
  const backofficeSession = await getSession(env.BACKOFFICE_DB, sessionHashFromRequest(request));
  if (!backofficeSession) return json({ error: 'not_authenticated' }, 401);

  const kitUserId = await sha256Hex(`backoffice:${backofficeSession.user.id}`);

  const install = await env.KIT_DB.prepare(
    `SELECT step, storage_location, drive_scope, gmail_connected,
            calendar_connected, google_connected_at, google_revoked_at
       FROM kit_installs WHERE user_id = ?`,
  )
    .bind(kitUserId)
    .first<{
      step: string;
      storage_location: string | null;
      drive_scope: string | null;
      gmail_connected: number;
      calendar_connected: number;
      google_connected_at: number | null;
      google_revoked_at: number | null;
    }>();

  if (!install) {
    // No install row at all — he's never clicked "Get Started". Not an
    // error: the card should just show "not set up yet" and point at the
    // Get Started button, not a broken state.
    return json({ started: false });
  }

  return json({
    started: true,
    step: install.step,
    storageLocation: install.storage_location,
    driveScope: install.drive_scope,
    gmailConnected: Boolean(install.gmail_connected),
    calendarConnected: Boolean(install.calendar_connected),
    // "connected" reflects OUR own OAuth grant only (scoped path) — true
    // whenever we currently hold a live token, i.e. connected more
    // recently than the last revoke. Native connector and local folder
    // never grant us anything, so this is always false on those paths;
    // the card must not offer to "turn off" a grant that was never ours.
    googleGrantActive:
      install.drive_scope === 'scoped' &&
      install.google_connected_at != null &&
      (install.google_revoked_at == null || install.google_revoked_at < install.google_connected_at),
  });
};
