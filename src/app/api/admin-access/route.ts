import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError } from "@/lib/app-logger";

export async function GET(request: Request) {
  try {
    const adminId = await getAdminUserIdFromRequest(request);
    if (!adminId) {
      return Response.json(
        { success: false, error: "Acesso negado à área administrativa." },
        { status: 403 }
      );
    }
    return Response.json({ success: true });
  } catch (e) {
    logAppError("api/admin-access.GET", e);
    return Response.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
