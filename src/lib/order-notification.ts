
import { createTraceId } from "@/lib/app-logger";
import type { CartItem } from "@/types/cart";
import type { Customer } from "@/types/customer";
import type { CompanySettings } from "@/types/company-settings";

export interface OrderSummary {
  orderId: string;
  customer: Customer;
  items: CartItem[];
  total: number;
}

function buildItemLine(item: CartItem): string {
  const name = item.product?.name ?? "Produto";
  const subtotal = (item.unit_price * item.quantity).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const unit = item.unit_price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const attrs = [
    item.selected_color_name,
    item.selected_size_label,
    item.selected_volume_label,
  ]
    .filter(Boolean)
    .join(", ");

  const attrText = attrs ? ` (${attrs})` : "";
  return `• ${name}${attrText} — ${item.quantity}x ${unit} = ${subtotal}`;
}

export function buildOrderText(
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string
): string {
  const itemLines = items.map(buildItemLine).join("\n");

  const totalFormatted = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return [
    "🛒 *NOVO PEDIDO*",
    orderId ? `📋 *Pedido:* #${orderId.slice(0, 8).toUpperCase()}` : null,
    "",
    `👤 *Cliente:* ${customer.full_name}`,
    `📱 *Telefone:* ${customer.phone_country_code} ${customer.phone_number}`,
    "",
    "🛍️ *Itens do Pedido:*",
    itemLines,
    "",
    `💰 *Total: ${totalFormatted}*`,
    "",
    `📅 *Data:* ${new Date().toLocaleString("pt-BR")}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

/**
 * Builds ContentVariables para notificar a EMPRESA sobre um novo pedido.
 * Variable "1" = nome do comprador
 * Variable "2" = pedido + telefone + itens + total
 */
function buildContentVariables(
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string
): Record<string, string> {
  const shortId = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : "—";
  const totalFormatted = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const itemsSummary = items
    .map((item) => {
      const name = item.product?.name ?? "Produto";
      return `${item.quantity}x ${name}`;
    })
    .join(", ");

  return {
    "1": customer.full_name,
    "2": `${shortId} | Cliente: ${customer.phone_country_code} ${customer.phone_number} | ${itemsSummary} | Total: ${totalFormatted}`,
  };
}

export function getWhatsAppUrl(
  settings: CompanySettings,
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string
): string | null {
  if (!settings.whatsapp_number || !settings.whatsapp_notifications_enabled) return null;
  const rawNumber = (settings.whatsapp_country_code + settings.whatsapp_number).replace(/\D/g, "");
  const text = encodeURIComponent(buildOrderText(customer, items, total, orderId));
  return `https://wa.me/${rawNumber}?text=${text}`;
}

export function getEmailUrl(
  settings: CompanySettings,
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string
): string | null {
  if (!settings.order_email || !settings.email_notifications_enabled) return null;
  const subject = encodeURIComponent(
    `Novo Pedido #${orderId ? orderId.slice(0, 8).toUpperCase() : "—"} — ${customer.full_name}`
  );
  const body = encodeURIComponent(
    buildOrderText(customer, items, total, orderId).replace(/\*/g, "")
  );
  return `mailto:${settings.order_email}?subject=${subject}&body=${body}`;
}

export function sendWhatsAppOrder(
  settings: CompanySettings,
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string
): void {
  const url = getWhatsAppUrl(settings, customer, items, total, orderId);
  if (url) window.open(url, "_blank");
}

export function sendEmailOrder(
  settings: CompanySettings,
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string
): void {
  const url = getEmailUrl(settings, customer, items, total, orderId);
  if (url) window.open(url, "_blank");
}

/**
 * Envia o pedido para o WhatsApp da EMPRESA (configurado em company_settings no servidor).
 * O telefone do cliente vai no conteúdo da mensagem.
 */
export async function sendTwilioWhatsApp(
  customer: Customer,
  items: CartItem[],
  total: number,
  orderId?: string,
  traceId?: string
): Promise<{ success: boolean; error?: string; traceId: string; httpStatus?: number }> {
  const trace = traceId || createTraceId("wa");
  const contentVariables = buildContentVariables(customer, items, total, orderId);

  try {
    const response = await fetch("/api/whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-trace-id": trace,
        "x-flow-source": "cart-finalize",
      },
      body: JSON.stringify({
        contentVariables,
        orderId,
        useCompanyWhatsappTarget: true,
      }),
    });

    const data = (await response.json()) as {
      success: boolean;
      error?: string;
      traceId?: string;
      httpStatus?: number;
    };
    const fromServerTrace = data.traceId || trace;
    if (!response.ok && !data.error) {
      return { success: false, error: `HTTP ${response.status}`, traceId: fromServerTrace, httpStatus: response.status };
    }
    return {
      success: data.success,
      error: data.error,
      traceId: fromServerTrace,
      httpStatus: data.httpStatus ?? response.status,
    };
  } catch (err) {
    console.error("Erro ao chamar /api/whatsapp:", err);
    return { success: false, error: "Erro de conexão com o servidor.", traceId: trace };
  }
}

/**
 * O browser pode não enxergar chaves sensíveis em `company_settings` (Anon/RLS).
 * Use só para exibir dicas de UI; o envio real confere no servidor.
 */
export function hasTwilioConfigured(settings: CompanySettings | null | undefined): boolean {
  if (!settings) return false;
  return !!(
    settings.twilio_account_sid &&
    settings.twilio_auth_token &&
    settings.twilio_whatsapp_from &&
    settings.twilio_content_sid &&
    settings.whatsapp_notifications_enabled
  );
}
