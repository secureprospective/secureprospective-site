/**
 * functions/api/wizard/bridge.ts
 * -----------------------------------------------------------------------
 * The real front door for "Get Started" in the back office.
 *
 * FOUND LIVE 2026-08-09: the back office's "Get Started" button linked
 * bare to /kit/setup with no token at all. redeem-invite.ts is single-use
 * and mints a brand-new random user_id on every redemption — neither of
 * those was ever going to work as a standing button a signed-in member
 * clicks repeatedly over weeks. First real click-through (Christopher,
 * Windows/Chrome, today) hit it: fields worked, Continue 401'd with a
 * generic "couldn't save" because no wizard session had ever been
 * established. Confirmed by hand: POSTing profile with zero session
 * cookie returns {error:"not_authenticated"} / 401, every time.
 *
 * This route is the fix, not a patch on top of the invite system —
 * BACKOFFICE_DB and KIT_DB are deliberately separate databases (the
 * project's own no-shared-data rule), so there is no foreign key from a
 * back-office member to a kit_installs row. What this route does instead:
 * verify the caller already holds a valid BACKOFFICE_DB session, then
 * derive a STABLE kit user id from that member's id (one-way hash, not
 * the raw id — nothing in KIT_DB ever contains a BACKOFFICE_DB
 * identifier) and mint a KIT_DB session for it. Same member, same
 * derived id, every single time — so re-clicking "Get Started" next
 * week, or from a fresh browser after the 30-day session cookie expires,
 * lands him back on his OWN in-progress install rather than a dead
 * invite-link error page or a duplicate kit_installs row.
 *
 * kit_invites / redeem-invite.ts is untouched and still there for a
 * genuine anonymous magic-link case if one is ever needed — this route
 * doesn't go near that table.
 */

import { getSession, sessionHashFromRequest } from '../../_lib/session';
import { createSession } from '../../_lib/kit-session';
import { sha256Hex } from '../../_lib/crypto-box';

interface BridgeEnv {
  BACKOFFICE_DB: D1Database;
  KIT_DB: D1Database;
}

// R6: the back-office standing control (a "Reconnect Google" action on the
// off-switch card) needs to mint a fresh KIT_DB session and then land on
// the real OAuth start route, not always `/kit/setup` — the agent has
// already finished the wizard, re-running it would be the wrong landing.
// Restricted to a same-origin relative path (must start with exactly one
// `/`, never `//` — a protocol-relative URL would silently become an
// open redirect) so this can't be turned into a redirect to anywhere else.
function safeNext(request: Request): string {
  const raw = new URL(request.url).searchParams.get('next');
  if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
  return '/kit/setup';
}

export const onRequestGet: PagesFunction<BridgeEnv> = async ({ request, env }) => {
  const backofficeSession = await getSession(env.BACKOFFICE_DB, sessionHashFromRequest(request));

  if (!backofficeSession) {
    // Not signed into the back office at all — send him there, not to a
    // dead end. He lands right back here via "Get Started" once he is.
    return new Response(null, { status: 302, headers: { Location: '/members/login' } });
  }

  const kitUserId = await sha256Hex(`backoffice:${backofficeSession.user.id}`);
  const issued = await createSession(env, kitUserId);

  return new Response(null, {
    status: 302,
    headers: {
      Location: safeNext(request),
      'Set-Cookie': issued.cookie,
    },
  });
};
