// Lead notification over Cloudflare Email Sending.
//
// The R2 object written by /api/lead is the system of record. This is the
// nudge that tells Christopher a record exists, so a campaign lead does not
// sit unread in a bucket. It is deliberately best effort: a send failure is
// reported to the caller so it can be logged, and never fails the visitor's
// submission.
//
// FROM_ADDRESS lives on a dedicated subdomain. The root domain carries the
// live Google Workspace mail for the business under DMARC p=reject, and
// onboarding it to Email Sending would mean editing the SPF and DKIM records
// that real business mail depends on. A subdomain gets its own records and
// cannot break the root.

export interface SendEmailBinding {
  send(message: {
    to: string;
    from: { email: string; name?: string };
    replyTo?: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<unknown>;
}

const FROM_ADDRESS = "leads@notify.secureprospective.com";
const FROM_NAME = "SecureProspective site";
const TO_ADDRESS = "info@secureprospective.com";

const ROUTE_LABELS: Record<string, string> = {
  operating: "Producer infrastructure (operating, available now)",
  "sp-plus": "SP+ fit review (active)",
  prospective: "AI-native transformation (prospective)",
};

export interface LeadRecord {
  name: string;
  email: string;
  route: string;
  message: string;
  source: string;
  page: string;
  created_at: string;
  key: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Central Time is where Christopher reads this, so the timestamp is stated in
// his own clock rather than making him convert UTC on a phone.
function localTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso)) + " Central";
  } catch {
    return iso + " UTC";
  }
}

export async function sendLeadNotification(
  email: SendEmailBinding,
  lead: LeadRecord,
): Promise<{ ok: boolean; error?: string }> {
  const routeLabel = ROUTE_LABELS[lead.route] ?? lead.route;
  const when = localTimestamp(lead.created_at);
  const surface = lead.source === "contact-form" ? "the contact form" : lead.source;

  // The subject has to be readable in a phone's notification shade without
  // opening anything, so the line and the person come first.
  const subject = `New ${routeLabel.split(" (")[0]} lead: ${lead.name}`;

  const text = [
    `A new lead came in through ${surface} on secureprospective.com.`,
    ``,
    `Name:    ${lead.name}`,
    `Email:   ${lead.email}`,
    `Line:    ${routeLabel}`,
    `Page:    ${lead.page || "unknown"}`,
    `Time:    ${when}`,
    ``,
    `Message:`,
    lead.message || "(none given)",
    ``,
    `Stored as ${lead.key}.`,
    `Sent automatically by the secureprospective.com contact form. Reply to this`,
    `message to answer the lead directly.`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#222222;">
      <p style="font-size:15px;line-height:1.6;margin:0 0 18px;">
        A new lead came in through ${escapeHtml(surface)} on secureprospective.com.
      </p>
      <table style="border-collapse:collapse;font-size:15px;line-height:1.6;">
        <tr><td style="padding:2px 16px 2px 0;color:#55565a;">Name</td><td>${escapeHtml(lead.name)}</td></tr>
        <tr><td style="padding:2px 16px 2px 0;color:#55565a;">Email</td><td><a href="mailto:${escapeHtml(lead.email)}" style="color:#0033A0;">${escapeHtml(lead.email)}</a></td></tr>
        <tr><td style="padding:2px 16px 2px 0;color:#55565a;">Line</td><td>${escapeHtml(routeLabel)}</td></tr>
        <tr><td style="padding:2px 16px 2px 0;color:#55565a;">Page</td><td>${escapeHtml(lead.page || "unknown")}</td></tr>
        <tr><td style="padding:2px 16px 2px 0;color:#55565a;">Time</td><td>${escapeHtml(when)}</td></tr>
      </table>
      <p style="font-size:15px;line-height:1.6;margin:18px 0 6px;font-weight:700;">Message</p>
      <p style="font-size:15px;line-height:1.6;margin:0;white-space:pre-wrap;">${escapeHtml(lead.message) || "(none given)"}</p>
      <p style="font-size:13px;line-height:1.6;color:#666666;margin:24px 0 0;">
        Stored as ${escapeHtml(lead.key)}. Sent automatically by the secureprospective.com
        contact form. Reply to this message to answer the lead directly.
      </p>
    </div>
  `.trim();

  try {
    await email.send({
      to: TO_ADDRESS,
      from: { email: FROM_ADDRESS, name: FROM_NAME },
      replyTo: lead.email,
      subject,
      html,
      text,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
