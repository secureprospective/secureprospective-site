/**
 * functions/api/wizard/provision.ts
 * -----------------------------------------------------------------------
 * Wizard screen 6 — "Building your brain".
 *
 * Creates the Drive folder tree and seeds it. Idempotent: safe to call
 * repeatedly, which is what makes resume-after-closing-the-tab and
 * one-click support repair possible.
 *
 * STATUS: MOCKUP. Never executed.
 *
 * NEEDS ADAPTING: json() is still a stand-in for the project's
 * functions/_lib/http.ts, which also carries the origin lock and
 * JSON-content-type CSRF check that this route SHOULD use (unlike the
 * OAuth callback).
 *
 * requireSession() now comes from the real _lib/session.ts. It used to be
 * a local stand-in whose bare decodeURIComponent() threw a URIError on a
 * malformed percent-escape in the cookie — turning a bad cookie into a
 * 500 at the edge of an auth check. parseSessionCookie() already handled
 * that; three routes just never adopted it.
 *
 * TIMING NOTE: this is ~14 sequential Drive round trips, roughly 3
 * seconds of I/O wait. That is fine on Workers — the CPU-time limit does
 * not count time blocked on fetch. If Drive ever gets slow enough that
 * this approaches a request timeout, the fix is to split provisioning
 * across two calls (folders, then files) rather than to parallelise it,
 * because children need their parents' IDs.
 */

import { accessTokenFor, TokenGoneError, type GoogleEnv } from '../../_lib/google-oauth';
import { provisionBrain, type ProvisionResult } from '../../_lib/drive-provision';
import type { AgencyProfile } from '../../_lib/seed-content';
import { requireSession } from '../../_lib/kit-session';
import { isDevBypass, type DevBypassEnv } from '../../_lib/dev-bypass';

/**
 * Preview-only, see _lib/dev-bypass.ts. Skips the real Drive API calls
 * (accessTokenFor + provisionBrain both need a live Google OAuth client
 * that doesn't exist yet) and writes the same shape of result directly,
 * so the rest of the flow — status, the setup-code screen, completion —
 * exercises real D1 state instead of guessing whether it would have
 * worked.
 */
async function bypassProvision(
  env: GoogleEnv,
  userId: string,
  folderName: string,
): Promise<ProvisionResult> {
  const now = Math.floor(Date.now() / 1000);
  const folderId = `dev-bypass-folder-${userId.slice(0, 8)}`;
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
  const paths = ['BRAIN.md', 'identity/agency-profile.md', 'identity/setup-check.md'];

  await env.KIT_DB.prepare(
    `UPDATE kit_installs
        SET drive_folder_id = ?, drive_folder_url = ?, drive_folder_name = ?,
            provisioned_at = ?,
            step = CASE WHEN step IN ('registered','profile_saved','google_connected')
                        THEN 'provisioned' ELSE step END,
            updated_at = ?
      WHERE user_id = ?`,
  )
    .bind(folderId, folderUrl, folderName, now, now, userId)
    .run();

  const created: ProvisionResult['created'] = [];
  for (const path of paths) {
    const fileId = `dev-bypass-file-${path.replace(/[^a-z0-9]/gi, '-')}`;
    await env.KIT_DB.prepare(
      `INSERT OR REPLACE INTO kit_install_files (user_id, logical_path, kind, drive_file_id, created_at)
       VALUES (?, ?, 'file', ?, ?)`,
    )
      .bind(userId, path, fileId, now)
      .run();
    created.push({ path, kind: 'file', id: fileId });
  }

  return { folderId, folderUrl, folderName, created, skipped: [] };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

/**
 * Four-word setup code — the proof mechanism for screen 8.
 *
 * Deliberately human-readable and human-typable: the agent has to read
 * it off Claude's reply and type it into our form. A UUID would be
 * technically fine and practically hostile.
 *
 * Word list kept small here for legibility; use ~256 short, unambiguous,
 * unmistakably-spelled words in the real build (~32 bits over four
 * words). It is not a secret — it authorizes nothing and its only job is
 * to be unguessable enough that typing a random guess doesn't pass.
 * /api/wizard/verify rate-limits attempts regardless.
 */
const WORDS = [
  'harbor', 'lantern', 'quiet', 'fern', 'copper', 'meadow', 'anchor', 'willow',
  'ember', 'compass', 'thistle', 'marble', 'orchard', 'signal', 'pebble', 'cedar',
];

function makeSetupCode(): string {
  const idx = crypto.getRandomValues(new Uint32Array(4)); // never Math.random()
  return [...idx].map((n) => WORDS[n % WORDS.length]).join('-');
}

export const onRequestPost: PagesFunction<GoogleEnv & DevBypassEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  const now = Math.floor(Date.now() / 1000);

  const install = await env.KIT_DB.prepare(
    `SELECT agent_display_name, agency_name, stated_work_email, google_email,
            profile_json, setup_code, drive_folder_id
       FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{
      agent_display_name: string | null;
      agency_name: string | null;
      stated_work_email: string | null;
      google_email: string | null;
      profile_json: string | null;
      setup_code: string | null;
      drive_folder_id: string | null;
    }>();

  if (!install?.agency_name) {
    return json({ error: 'profile_incomplete', step: 'profile' }, 409);
  }
  if (!install.google_email) {
    return json({ error: 'google_not_connected', step: 'google' }, 409);
  }

  // The setup code is generated ONCE and reused across re-runs, so a
  // resumed wizard doesn't show a code that differs from the one already
  // sitting in the agent's Drive file.
  const setupCode = install.setup_code ?? makeSetupCode();
  if (!install.setup_code) {
    await env.KIT_DB.prepare(
      `UPDATE kit_installs SET setup_code = ?, updated_at = ? WHERE user_id = ?`,
    )
      .bind(setupCode, now, session.userId)
      .run();
  }

  const extra = install.profile_json ? JSON.parse(install.profile_json) : {};
  const profile: AgencyProfile = {
    agentDisplayName: install.agent_display_name ?? 'there',
    agencyName: install.agency_name,
    // Use the address Google VERIFIED, not the one he typed. Everything
    // in the seeded content should reflect reality, not intent.
    workEmail: install.google_email ?? install.stated_work_email ?? '',
    statesLicensed: extra.statesLicensed,
    linesOfBusiness: extra.linesOfBusiness,
    carriers: extra.carriers,
    emailDisclaimer: extra.emailDisclaimer,
  };

  let result: ProvisionResult;

  if (isDevBypass(env)) {
    result = await bypassProvision(env, session.userId, profile.agencyName);
  } else {
    let accessToken: string;
    try {
      accessToken = await accessTokenFor(env, session.userId);
    } catch (e) {
      if (e instanceof TokenGoneError) {
        // Expected state, not a 500. Most likely causes: we already
        // revoked our own access after a previous completion (§2.7 Option
        // A), or the 7-day Testing-mode trap killed the refresh token, or
        // the agent revoked us at myaccount.google.com/permissions.
        // Send him back to the Connect Google screen; nothing else is lost.
        return json({ error: 'google_reauth_required', step: 'google' }, 409);
      }
      throw e;
    }

    try {
      result = await provisionBrain(env, accessToken, session.userId, profile, setupCode);
    } catch (e) {
      const msg = String(e);
      // Worth distinguishing in the UI: a full Drive is the agent's to fix
      // and has an obvious remedy, unlike a generic failure.
      if (msg.includes('storageQuotaExceeded')) {
        return json({ error: 'drive_full' }, 507);
      }
      console.error('provision failed', e);
      return json({ error: 'provision_failed' }, 500);
    }
  }

  return json({
    ok: true,
    folderId: result.folderId,
    folderUrl: result.folderUrl,
    folderName: result.folderName,
    // The UI renders these as the honest progress list on screen 6 —
    // real names of real files, not a spinner.
    created: result.created.map((c) => c.path),
    skipped: result.skipped,
    googleEmail: install.google_email,
  });
  /*
   * NOT RETURNED: setupCode.
   *
   * It used to be, with the comment "shown on screen 8". Sending it to the
   * browser destroys the only real proof in the wizard. The agent is
   * supposed to obtain that code by asking Claude to read
   * identity/setup-check.md — which is what demonstrates the connector is
   * live, on the right Google account, pointed at the right folder. If the
   * page already holds the code, the screen degrades into typing back
   * something we just told him, which proves nothing about Claude at all.
   *
   * The comparison happens server-side in /api/wizard/verify. The client
   * never needs this value, and /api/wizard/status must not return it
   * either — see the header note there.
   */
};
