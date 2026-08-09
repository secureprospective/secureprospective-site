/**
 * functions/api/wizard/profile.ts
 * -----------------------------------------------------------------------
 * Screen 1 — the only place per-agent facts are collected.
 *
 * Everything here ends up templated into identity/agency-profile.md, which
 * is the one agent-specific file in the whole brain. That is what makes
 * agent #2 a form to fill in rather than a find-and-replace.
 *
 * STATUS: written, never run against a live D1.
 *
 * NEEDS ADAPTING: json() is a stand-in for the house _lib/http.ts, which
 * carries the origin lock and JSON-content-type CSRF check. This route is
 * a same-origin mutation and SHOULD use it once that module lands.
 */

import { requireSession } from '../../_lib/kit-session';

interface ProfileEnv {
  KIT_DB: D1Database;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

/**
 * Trim, cap, and drop anything that is not a string.
 *
 * The cap is not a security boundary — it is a guard against a paste
 * accident putting a whole email thread into a field that gets templated
 * into a markdown table, where it would wreck the file the agent has to
 * read. Long-form belongs in the file itself, which he can edit.
 */
function field(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

export const onRequestPost: PagesFunction<ProfileEnv> = async ({ request, env }) => {
  const session = await requireSession(request, env);
  if (!session) return json({ error: 'not_authenticated' }, 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json<Record<string, unknown>>();
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const agentDisplayName = field(body.agentDisplayName, 120);
  const agencyName = field(body.agencyName, 120);
  const statedWorkEmail = field(body.statedWorkEmail, 254);

  // The two that must be present. Everything else is genuinely optional and
  // renders as "not filled in yet" in the brain file — which is honest, and
  // is a prompt the agent can act on later rather than a wall now.
  //
  // agencyName in particular is load-bearing: it names the Drive folder.
  if (!agentDisplayName) return json({ error: 'name_required', field: 'agentDisplayName' }, 400);
  if (!agencyName) return json({ error: 'agency_required', field: 'agencyName' }, 400);

  // Deliberately NOT validated beyond "looks like an address". It is a hint
  // used for Google's login_hint and for comparison against the account
  // Google actually reports back; the callback records the authoritative
  // one. Rejecting a real address over a regex would block a real agent to
  // protect a value we already treat as advisory.
  if (statedWorkEmail && !statedWorkEmail.includes('@')) {
    return json({ error: 'email_looks_wrong', field: 'statedWorkEmail' }, 400);
  }

  const profileJson = JSON.stringify({
    statesLicensed: field(body.statesLicensed),
    linesOfBusiness: field(body.linesOfBusiness),
    carriers: field(body.carriers),
    emailDisclaimer: field(body.emailDisclaimer, 1000),
  });

  const now = Math.floor(Date.now() / 1000);

  // UPSERT. Screen 1 is re-editable — the agent may come back and fix a
  // typo in his agency name — and the wizard is explicitly allowed to
  // navigate backwards. `step` only ever moves FORWARD: re-saving the
  // profile after Google is connected must not drag him back two screens.
  await env.KIT_DB.prepare(
    `INSERT INTO kit_installs
       (user_id, step, agent_display_name, agency_name, stated_work_email,
        profile_json, created_at, updated_at)
     VALUES (?, 'profile_saved', ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       agent_display_name = excluded.agent_display_name,
       agency_name        = excluded.agency_name,
       stated_work_email  = excluded.stated_work_email,
       profile_json       = excluded.profile_json,
       step               = CASE WHEN kit_installs.step = 'registered'
                                 THEN 'profile_saved' ELSE kit_installs.step END,
       updated_at         = excluded.updated_at`,
  )
    .bind(session.userId, agentDisplayName, agencyName, statedWorkEmail, profileJson, now, now)
    .run();

  await env.KIT_DB.prepare(
    `INSERT INTO kit_audit_log (user_id, at, event) VALUES (?, ?, 'profile.saved')`,
  )
    .bind(session.userId, now)
    .run();

  return json({ ok: true });
};
