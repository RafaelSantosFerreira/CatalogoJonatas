import jwt from "jsonwebtoken";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { getSetupAdminCredentials } from "@/lib/env-setup-admin";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";

export interface AdminJwtPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export function signAdminJwt(payload: { sub: string; email: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function getAdminUserIdFromRequest(request: Request): Promise<string | null> {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  if (!token) return null;

  let decoded: AdminJwtPayload;
  try {
    decoded = jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
  } catch {
    return null;
  }

  if (!decoded.sub || !decoded.email) return null;

  const expectedEmail = getSetupAdminCredentials().email.trim().toLowerCase();
  if (decoded.email.trim().toLowerCase() !== expectedEmail) return null;

  const admin = await db
    .select({ id: schema.adminUsers.id, email_confirmed_at: schema.adminUsers.email_confirmed_at })
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.id, decoded.sub))
    .get();

  if (!admin || !admin.email_confirmed_at) return null;
  return admin.id;
}
