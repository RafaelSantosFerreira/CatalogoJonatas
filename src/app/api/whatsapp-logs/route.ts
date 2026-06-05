import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { logAppError } from "@/lib/app-logger";
import type { WhatsAppLogStatus } from "@/db/schema";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";

export async function GET(request: Request) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) return Response.json({ error: "Não autorizado." }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
    const status = searchParams.get("status");

    const query = db
      .select()
      .from(schema.whatsappLogs)
      .orderBy(desc(schema.whatsappLogs.created_at))
      .limit(limit);

    const data = status && status !== "all"
      ? await db
          .select()
          .from(schema.whatsappLogs)
          .where(eq(schema.whatsappLogs.status, status as WhatsAppLogStatus))
          .orderBy(desc(schema.whatsappLogs.created_at))
          .limit(limit)
      : await query;

    return Response.json({ success: true, data: data ?? [] });
  } catch (err) {
    logAppError("api/whatsapp-logs.catch", err);
    return Response.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
