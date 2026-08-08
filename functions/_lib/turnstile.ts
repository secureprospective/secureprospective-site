// Cloudflare Turnstile server-side verification. Runs on login and
// accept-invite submissions — the two forms a scripted attacker would
// otherwise hit (credential stuffing, invite-token brute-forcing).
// Site key is public (embedded in the page); secret key is a Pages secret,
// never exposed to the client.

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(
  secretKey: string,
  token: unknown,
  remoteIp: string | null,
): Promise<boolean> {
  if (typeof token !== "string" || !token) return false;

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as TurnstileVerifyResponse;
    return data.success === true;
  } catch {
    // Network failure to Cloudflare's own verify endpoint: fail closed, not open.
    return false;
  }
}
