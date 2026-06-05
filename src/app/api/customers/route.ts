import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { logAppError } from "@/lib/app-logger";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  full_name: z.string().min(1),
  phone_country_code: z.string().default("+55"),
  phone_number: z.string().min(1),
});

export async function GET(request: Request) {
  const rl = checkRateLimit({ request, key: "api:customers", windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return Response.json({ error: "Muitas tentativas." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "id obrigatório." }, { status: 400 });
  }
  try {
    const customer = (await db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id)))[0];
    return Response.json({ data: customer ?? null });
  } catch (e) {
    logAppError("api/customers.GET", e);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rl = checkRateLimit({ request, key: "api:customers", windowMs: 60_000, max: 60 });
  if (!rl.allowed) {
    return Response.json({ error: "Muitas tentativas." }, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos." }, { status: 400 });
  }

  try {
    const inserted = await db
      .insert(schema.customers)
      .values(parsed.data)
      .returning();
    return Response.json({ data: inserted[0] });
  } catch (e) {
    logAppError("api/customers.POST", e);
    return Response.json({ error: "Erro ao criar cliente." }, { status: 500 });
  }
}
