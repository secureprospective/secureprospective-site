// Shared gate for every /api/auth/admin/* endpoint: a valid session whose
// user has role='admin'. Every admin route calls this first and fails
// closed on null — same discipline as session.ts's getSession().

import { sessionHashFromRequest, getSession, type SessionUser } from "./session";

export async function requireAdminSession(
  db: D1Database,
  request: Request,
): Promise<SessionUser | null> {
  const session = await getSession(db, sessionHashFromRequest(request));
  if (!session || session.user.role !== "admin") return null;
  return session.user;
}
