import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";

export async function GET(request: Request) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json(
      { success: false, error: "Acesso negado à área administrativa." },
      { status: 403 }
    );
  }
  return Response.json({ success: true });
}

