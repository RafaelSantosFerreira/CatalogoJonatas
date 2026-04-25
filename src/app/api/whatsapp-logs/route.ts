import { supabaseAdmin } from "@/integrations/supabase/server";
import { logAppError } from "@/lib/app-logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("whatsapp_logs")
      .select(
        "id, order_id, to_number, from_number, content_sid, content_variables, status, twilio_message_sid, http_status_code, error_code, error_message, response_body, request_payload, sent_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      logAppError("api/whatsapp-logs.query", error);
      return Response.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return Response.json({ success: true, data: data ?? [] });
  } catch (err) {
    logAppError("api/whatsapp-logs.catch", err);
    return Response.json(
      { success: false, error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}
