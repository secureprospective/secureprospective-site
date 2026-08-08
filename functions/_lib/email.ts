// Transactional email (invite links) via Brevo's HTTP API. Pattern copied
// from TFM's members build (functions/_lib/email.ts). Wiring deferred this
// session per the 2026-08-08 decision to build DB/endpoints/forms first and
// wire Brevo last, given TFM's own send is currently failing in production
// with an unresolved root cause (see reference_cloudflare_d1_auth_pattern,
// bug #7). The invite endpoint works without this: it returns the raw
// accept-invite link in its response regardless of whether the send below
// succeeds, so an admin can copy/paste it by hand until Brevo is trusted.
//
// SENDER must be a sender address verified in SecureProspective's own Brevo
// account (Settings -> Senders) before this can send anything — do not
// assume the TFM sender or TFM's Brevo account apply here, per
// feedback_tfm_sp_data_separation.
const SENDER = { name: "SecureProspective", email: "TODO-set-verified-sender@secureprospective.com" };

export async function sendInviteEmail(
  apiKey: string,
  toEmail: string,
  acceptUrl: string,
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      sender: SENDER,
      to: [{ email: toEmail }],
      subject: "You're invited to the SecureProspective back office",
      htmlContent: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#222222;">
          <p style="font-size:15px;line-height:1.6;">You have been invited to the SecureProspective back office.</p>
          <p style="font-size:15px;line-height:1.6;">
            <a href="${acceptUrl}" style="color:#0033A0;">Set your password to accept the invite</a>
          </p>
          <p style="font-size:13px;line-height:1.6;color:#666666;">
            This link expires in 7 days. If you were not expecting this, you can ignore this email.
          </p>
        </div>
      `.trim(),
    }),
  });
  return { ok: res.ok, status: res.status };
}
