/**
 * functions/api/wizard/verify.ts
 * -----------------------------------------------------------------------
 * Wizard screen 8 — the proof step.
 *
 * The agent asks Claude to read identity/setup-check.md and tell him the
 * setup code. He types it here. If it matches, FOUR things are proven at
 * once, and no other check the wizard could perform proves any of them:
 *
 *   1. The agent's claude.ai Google Drive connector is authorized.
 *   2. It is authorized on THE SAME GOOGLE ACCOUNT the folder lives in —
 *      a different account cannot see this file at all.
 *   3. Claude can reach THIS SPECIFIC FOLDER, not just "Drive".
 *   4. The agent has personally had one successful conversation with his
 *      assistant, which is the actual product outcome.
 *
 * It also, incidentally, settles the open question of whether the
 * connector can read plain text/markdown at all (see the load-bearing
 * unknown in drive-provision.ts). If .md is unreadable, THIS is where it
 * surfaces — loudly, on the first agent, inside setup, instead of
 * silently in production six weeks later.
 *
 * STATUS: MOCKUP. Never executed.
 *
 * NEEDS ADAPTING: json() is still a stand-in for the project's
 * _lib/http.ts (origin lock + JSON-CSRF check). requireSession() now
 * comes from the real _lib/session.ts — see the note in provision.ts on
 * why the local stand-in it replaced could 500 on a malformed cookie.
 */

import { accessTokenFor, TokenGoneError, type GoogleEnv } from '../../_lib/google-oauth';
import { brainWriteWasObserved } from '../../_lib/drive-provision';
import { requireSession } from '../../_lib/kit-session';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const MAX_ATTEMPTS = 10;

/** Normalise before comparing. The agent is typing from a chat reply
 *  and may add quotes, capitals, spaces, or a trailing period. Rejecting
 *  a CORRECT answer over punctuation would be the cruellest possible
 *  failure at the final step of setup. */
function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '');
}

/** Constant-time compare. Genuinely marginal here — the code authorizes
 *  nothing — but the house style already does timing-safe comparison in
 *  _lib/password.ts, and matching house style costs three lines. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const onRequestPost: PagesFunction<GoogleEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  const now = Math.floor(Date.now() / 1000);
  const body = await request.json<{
    check: 'read' | 'read_selfreport' | 'write' | 'write_selfreport';
    code?: string;
  }>();

  const install = await env.KIT_DB.prepare(
    `SELECT setup_code, setup_code_attempts, provisioned_at, google_email,
            verified_read_at, storage_location, drive_scope
       FROM kit_installs WHERE user_id = ?`,
  )
    .bind(session.userId)
    .first<{
      setup_code: string | null;
      setup_code_attempts: number;
      provisioned_at: number | null;
      google_email: string | null;
      verified_read_at: number | null;
      storage_location: string | null;
      drive_scope: string | null;
    }>();

  /* ================================================================= */
  /* CHECK A' — the delegated paths' proof (native connector, local)   */
  /* ================================================================= */
  /*
   * R2's Gate 2 answer (research/wizard-reshape-r2-blocker.md): the
   * four-word CODE check below (check: 'read') cannot run here — no
   * route on these paths mints a setup_code, because there is nothing
   * for OUR server to write ahead of time. Claude has to create the
   * folder itself, and the one channel to tell Claude what to name the
   * file is the on-screen prompt (cowork-link.js's createFolderPrompt),
   * which the agent's own browser already displays in full — so a typed
   * -back code would prove nothing (he'd be reading it off our own page,
   * not out of Claude's reply, defeating the exact property status.ts's
   * header explains the code check exists to prove).
   *
   * So this is a SELF-REPORT, structurally identical in spirit to
   * 'write_selfreport' below: the agent is trusted to say Claude actually
   * did it. Recorded honestly, under its own distinct audit event, same
   * posture as verify.write.selfreport vs verify.write.observed — a
   * regulator or E&O carrier reading kit_audit_log later must be able to
   * tell an observed proof from a self-reported one, and this keeps that
   * true for the read check as it already was for the write check.
   */
  if (body.check === 'read_selfreport') {
    if (install?.drive_scope === 'scoped') {
      // The scoped path has a real code check available — self-report
      // must not be usable as a shortcut around it.
      return json({ error: 'code_check_required', step: 'verify' }, 409);
    }
    await env.KIT_DB.prepare(
      `UPDATE kit_installs
          SET verified_read_at = ?,
              step = CASE WHEN step IN ('storage_chosen','provisioned','handoff_ack')
                          THEN 'verified_read' ELSE step END,
              updated_at = ?
        WHERE user_id = ?`,
    )
      .bind(now, now, session.userId)
      .run();
    await env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
       VALUES (?, ?, 'verify.read.selfreport', ?)`,
    )
      .bind(session.userId, now, JSON.stringify({ source: 'agent_confirmed_claude_created_folder' }))
      .run();
    return json({ ok: true, observed: false });
  }

  if (!install?.setup_code) return json({ error: 'not_provisioned' }, 409);

  /* ================================================================= */
  /* CHECK A — can Claude READ the brain?  (required)                  */
  /* ================================================================= */
  if (body.check === 'read') {
    if (install.setup_code_attempts >= MAX_ATTEMPTS) {
      // A four-word code from a short list is guessable given unlimited
      // tries. Mirrors the `attempts` column already on
      // email_verification_codes.
      return json({ error: 'too_many_attempts' }, 429);
    }

    await env.KIT_DB.prepare(
      `UPDATE kit_installs SET setup_code_attempts = setup_code_attempts + 1,
              updated_at = ? WHERE user_id = ?`,
    )
      .bind(now, session.userId)
      .run();

    const ok = timingSafeEqual(normalise(body.code ?? ''), normalise(install.setup_code));

    await env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event) VALUES (?, ?, ?)`,
    )
      .bind(session.userId, now, ok ? 'verify.read.pass' : 'verify.read.fail')
      .run();

    if (!ok) {
      // The UI must NOT say "wrong code". The code is almost never what
      // went wrong — the agent faithfully typed what Claude told him.
      // What went wrong is upstream, and these are the real candidates,
      // in descending order of likelihood. Screen 8 renders them as
      // branches to check, not as an error message.
      return json({
        ok: false,
        attemptsRemaining: MAX_ATTEMPTS - (install.setup_code_attempts + 1),
        likelyCauses: [
          {
            id: 'wrong_google_account',
            // The single most common real-world failure in this design.
            title: `Claude may be connected to a different Google account`,
            detail: `Your folder lives in ${install.google_email}. In Claude, check Settings → Connectors → Google Drive and confirm it shows that same address.`,
          },
          {
            id: 'connector_off',
            title: 'The Google Drive connection may not be turned on in Claude',
            detail: 'In Claude, go to Settings → Connectors and make sure Google Drive says Connected.',
          },
          {
            id: 'admin_blocked',
            title: "Your company's IT administrator may have blocked it",
            detail: 'If Google showed a message about an administrator when you connected, we have an email you can forward to them.',
          },
          {
            id: 'not_synced_yet',
            title: 'Drive may not have finished indexing the new file',
            detail: 'This is normal in the first minute or two. Wait 30 seconds and ask Claude again.',
          },
        ],
      });
    }

    await env.KIT_DB.prepare(
      `UPDATE kit_installs
          SET verified_read_at = ?,
              step = CASE WHEN step IN ('provisioned','handoff_ack')
                          THEN 'verified_read' ELSE step END,
              updated_at = ?
        WHERE user_id = ?`,
    )
      .bind(now, now, session.userId)
      .run();

    return json({ ok: true, proved: [
      'claude_can_reach_drive',
      'same_google_account',
      'claude_can_read_this_folder',
    ] });
  }

  /* ================================================================= */
  /* CHECK B — can Claude WRITE to the brain?  (ADVISORY ONLY)         */
  /* ================================================================= */
  /*
   * !! THIS CHECK MUST NEVER BLOCK COMPLETION. Two independent reasons,
   * !! both of them limits of the system rather than of the agent:
   * !!
   * !!  1. Under `drive.file` we can only observe changes to files WE
   * !!     created. Anything Claude creates itself is invisible to us.
   * !!  2. Whether the claude.ai Drive connector can modify an existing
   * !!     file in place is UNDOCUMENTED and may simply not be possible.
   * !!
   * !! So: on failure, offer the manual fallback — "open your folder and
   * !! look; did the line appear?" — and take the agent's word for it.
   * !!
   * !! THE PROMPT THE UI SHOWS MUST NAME identity/setup-check.md.
   * !! Asking him to have Claude "add a line to the journal" cannot pass:
   * !! brain-write requires a NEW dated file for journal entries, and a
   * !! new file is precisely what we cannot see. See WRITE_CHECK_PATH in
   * !! drive-provision.ts.
   */
  if (body.check === 'write') {
    let accessToken: string;
    try {
      accessToken = await accessTokenFor(env, session.userId);
    } catch (e) {
      if (e instanceof TokenGoneError) {
        // We may have already given up our own Drive access. That is the
        // intended end state, not a failure — fall back to asking him.
        return json({ ok: false, inconclusive: true, reason: 'no_google_access', manualFallback: true });
      }
      throw e;
    }

    const since = install.provisioned_at ?? 0;
    const res = await brainWriteWasObserved(env, accessToken, session.userId, since);

    if (res.modified) {
      // R4: reaching a passing write check means screen 4's task 1 (turn
      // on Gmail/Calendar, plus Drive when that task is shown) is done —
      // record it so a resumed session does not ask again. SELF-REPORTED
      // in spirit even though this particular branch is the OBSERVED write
      // check: nothing here independently confirms Gmail/Calendar
      // specifically got turned on, only that the write check passed,
      // which is why 0003's own header marks these two flags self-reported
      // rather than verified regardless of which verify.ts branch sets them.
      await env.KIT_DB.prepare(
        `UPDATE kit_installs
            SET verified_write_at = ?,
                gmail_connected = 1, calendar_connected = 1,
                step = CASE WHEN step = 'verified_read' THEN 'verified_write' ELSE step END,
                updated_at = ?
          WHERE user_id = ?`,
      )
        .bind(now, now, session.userId)
        .run();
      await env.KIT_DB.prepare(
        `INSERT INTO kit_audit_log (user_id, at, event) VALUES (?, ?, 'verify.write.observed')`,
      )
        .bind(session.userId, now)
        .run();
      return json({ ok: true, observed: true });
    }

    return json({
      ok: false,
      inconclusive: true,   // NOT the same as "it failed"
      reason: res.reason,
      manualFallback: true,
      note: 'We can only see changes to files we created ourselves. If Claude made a new file instead, we cannot see it — please look in the folder yourself.',
    });
  }

  /* ================================================================= */
  /* CHECK B' — the agent looked himself and says it worked            */
  /* ================================================================= */
  /*
   * The manual fallback, recorded honestly.
   *
   * Check B is advisory and structurally capable of a false negative, so
   * the wizard must not strand him on it. But "let the UI move on" and
   * "write verified_write_at" are different things, and conflating them
   * would put an observation in the record that nobody observed.
   *
   * So this records the same timestamp under a DIFFERENT audit event.
   * kit_audit_log is the thing a regulator or an E&O carrier might one day
   * read, and it must be able to say which of these two happened:
   *   verify.write.observed   — we watched modifiedTime advance.
   *   verify.write.selfreport — the agent opened the folder and told us.
   * Both are legitimate. Only one is evidence we produced.
   */
  if (body.check === 'write_selfreport') {
    if (!install.verified_read_at) {
      // The read proof is the gate. Self-reporting a write on an install
      // that never demonstrated a read would let someone skip the only
      // unfakeable check in the flow.
      return json({ error: 'verify_read_pending', step: 'verify' }, 409);
    }

    // R4: same reasoning as the observed branch above — reaching this
    // point means screen 4's task 1 is done, self-reported through the
    // manual fallback rather than the write check itself.
    await env.KIT_DB.prepare(
      `UPDATE kit_installs
          SET verified_write_at = ?,
              gmail_connected = 1, calendar_connected = 1,
              step = CASE WHEN step = 'verified_read' THEN 'verified_write' ELSE step END,
              updated_at = ?
        WHERE user_id = ?`,
    )
      .bind(now, now, session.userId)
      .run();

    await env.KIT_DB.prepare(
      `INSERT INTO kit_audit_log (user_id, at, event, detail_json)
       VALUES (?, ?, 'verify.write.selfreport', ?)`,
    )
      .bind(session.userId, now, JSON.stringify({ source: 'agent_looked_in_folder' }))
      .run();

    return json({ ok: true, observed: false });
  }

  return json({ error: 'unknown_check' }, 400);
};
