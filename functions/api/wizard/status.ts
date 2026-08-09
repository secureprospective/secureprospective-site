/**
 * functions/api/wizard/status.ts
 * -----------------------------------------------------------------------
 * THE source of truth for the wizard shell.
 *
 * Every component renders from this and nothing else. There is no
 * localStorage anywhere in the wizard, deliberately: the agent may start on
 * a laptop, wander off, and come back on a phone, and a flow that remembers
 * its position in the wrong browser is worse than one that does not
 * remember at all.
 *
 * STATUS: written, never run against a live D1. The SQL is a single SELECT
 * against tables defined in migrations/0002_insuranceagentkit.sql.
 *
 * =================== WHAT THIS ROUTE MUST NEVER RETURN ===================
 * `setup_code`. Not once, not in any shape, not "just for the dev harness".
 *
 * The whole proof mechanism on screen 3 is that the agent reads the code
 * out of Claude's reply and types it back to us. It proves the connector is
 * live, on the right Google account, pointed at the right folder. If the
 * code is ever in the page, the proof collapses into a copy-paste that
 * proves nothing, and the first honest signal that the Drive connection
 * does not work would move from "inside setup, on the first agent" to
 * "silently, six weeks later" — the exact failure this product is built to
 * avoid.
 *
 * The same goes for `google_refresh_token_enc` (sealed, but there is no
 * reason for it to leave the server) and `google_sub`.
 * =========================================================================
 */

import { requireSession } from '../../_lib/kit-session';
import { brainFolderName } from '../../_lib/drive-provision';

interface StatusEnv {
  KIT_DB: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      // This is per-agent install state. It must never sit in a shared
      // cache, and it changes on nearly every screen.
      'cache-control': 'no-store',
    },
  });
}

export const onRequestGet: PagesFunction<StatusEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  const row = await env.KIT_DB.prepare(
    `SELECT step, agent_display_name, agency_name, stated_work_email, profile_json,
            google_email, google_connected_at, google_revoked_at,
            drive_folder_id, drive_folder_url, drive_folder_name, provisioned_at,
            verified_read_at, verified_write_at, completed_at
       FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{
      step: string;
      agent_display_name: string | null;
      agency_name: string | null;
      stated_work_email: string | null;
      profile_json: string | null;
      google_email: string | null;
      google_connected_at: number | null;
      google_revoked_at: number | null;
      drive_folder_id: string | null;
      drive_folder_url: string | null;
      drive_folder_name: string | null;
      provisioned_at: number | null;
      verified_read_at: number | null;
      verified_write_at: number | null;
      completed_at: number | null;
    }>();

  // No row yet is a normal state, not an error: the invite has been
  // consumed and the install row is created lazily on the first profile
  // save. The shell renders screen 1 for this exactly as it does for a
  // half-filled profile.
  if (!row) {
    return json({
      step: 'registered',
      profile: {},
      google: { connected: false },
      drive: { provisioned: false },
      proof: { read: false, write: false },
      complete: false,
    });
  }

  let extra: Record<string, unknown> = {};
  if (row.profile_json) {
    try {
      extra = JSON.parse(row.profile_json);
    } catch {
      // A corrupt blob must not 500 the screen the agent is standing on.
      // An empty profile renders as "not filled in yet", which is true and
      // recoverable; a 500 is neither.
      extra = {};
    }
  }

  const googleConnected = Boolean(row.google_email) && !row.google_revoked_at;

  return json({
    step: row.step,

    profile: {
      agentDisplayName: row.agent_display_name ?? '',
      agencyName: row.agency_name ?? '',
      statedWorkEmail: row.stated_work_email ?? '',
      statesLicensed: (extra.statesLicensed as string) ?? '',
      linesOfBusiness: (extra.linesOfBusiness as string) ?? '',
      carriers: (extra.carriers as string) ?? '',
      emailDisclaimer: (extra.emailDisclaimer as string) ?? '',
    },

    google: {
      connected: googleConnected,
      // AUTHORITATIVE — from Google's id_token, never from what he typed.
      email: row.google_email ?? '',
      connectedAt: row.google_connected_at,
      revokedAt: row.google_revoked_at,
      /**
       * The single most useful failure signal in the whole flow, and the
       * one the old design had no way to surface: he authorised a Google
       * account that is not the one he told us he works from.
       *
       * It is not an error — plenty of agents have a personal address
       * signed in first — but it decides which address screen 4 tells him
       * to use at claude.ai, and getting that wrong is what produces
       * "Claude can't find my folder" two screens later.
       */
      mismatchesStated:
        googleConnected &&
        Boolean(row.stated_work_email) &&
        row.google_email!.toLowerCase() !== row.stated_work_email!.toLowerCase(),
    },

    drive: {
      provisioned: Boolean(row.drive_folder_id) && Boolean(row.provisioned_at),
      folderUrl: row.drive_folder_url ?? '',
      /**
       * The name the agent must compare against what Anthropic's folder
       * dialog shows him on screen 3.
       *
       * Prefer the name the folder was ACTUALLY created with. Recomputing
       * it from agency_name would be wrong for anyone who edited his
       * agency name after provisioning — we never rename the Drive folder,
       * so we would be telling him to expect a name that is not there, and
       * screen 3's one real safety instruction ("if it says anything else,
       * say no") would fire on the correct folder.
       *
       * The computed fallback is for BEFORE provisioning, where it is the
       * name we are about to use and therefore correct.
       */
      folderName:
        row.drive_folder_name ||
        (row.agency_name ? brainFolderName(row.agency_name) : ''),
    },

    proof: {
      read: Boolean(row.verified_read_at),
      write: Boolean(row.verified_write_at),
    },

    complete: Boolean(row.completed_at),
  });
};
