
"use client";

import { useState, useCallback } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Package,
  UserCheck,
  LogOut,
  ShoppingBag,
  Send,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCart } from "@/context/CartContext";
import { useCustomer } from "@/context/CustomerContext";
import { CustomerRegisterModal } from "./CustomerRegisterModal";
import { OrderConfirmationModal } from "./OrderConfirmationModal";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { createTraceId, logAppInfo, logAppWarn } from "@/lib/app-logger";
import {
  getWhatsAppUrl,
  getEmailUrl,
  sendTwilioWhatsApp,
  hasTwilioConfigured,
} from "@/lib/order-notification";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Customer } from "@/types/customer";
import type { CartItem } from "@/types/cart";

export function CartDrawer() {
  const { items, itemCount, total, removeItem, updateQuantity, clearCart } = useCart();
  const { customer, clearCustomer } = useCustomer();
  const { settings } = useCompanySettings();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<{
    orderId: string;
    customer: Customer;
    items: CartItem[];
    total: number;
    whatsappUrl: string | null;
    emailUrl: string | null;
    twilioSent: boolean;
  } | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  const saveOrder = useCallback(
    async (cust: Customer, cartItems: CartItem[], orderTotal: number) => {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: cust.id,
          status: "pending",
          total_amount: orderTotal,
          customer_name: cust.full_name,
          customer_phone_country_code: cust.phone_country_code,
          customer_phone_number: cust.phone_number,
          customer_address: null,
        })
        .select("*")
        .maybeSingle();

      if (orderError || !order) {
        console.error("Erro ao salvar pedido:", orderError);
        return null;
      }

      const orderItems = cartItems.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        product_name: item.product?.name ?? "Produto",
        product_sku: item.product?.sku ?? null,
        product_image_url: item.product?.image_url ?? null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.unit_price * item.quantity,
        selected_color_id: item.selected_color_id ?? null,
        selected_color_name: item.selected_color_name ?? null,
        selected_size_id: item.selected_size_id ?? null,
        selected_size_label: item.selected_size_label ?? null,
        selected_volume_id: item.selected_volume_id ?? null,
        selected_volume_label: item.selected_volume_label ?? null,
      }));

      await supabase.from("order_items").insert(orderItems);

      return order.id as string;
    },
    []
  );

  const handleFinalize = async () => {
    const traceId = createTraceId("cart");
    if (!customer) {
      setRegisterOpen(true);
      return;
    }
    if (items.length === 0) {
      toast.error("Seu carrinho está vazio.");
      return;
    }

    setFinalizing(true);
    logAppInfo("cart.finalize.start", "Iniciando finalização do pedido", {
      traceId,
      itemCount: items.length,
      customerId: customer.id,
    });
    logAppInfo("cart.finalize.params", "Parâmetros do envio no carrinho", {
      traceId,
      customerName: customer.full_name,
      customerPhoneCountry: customer.phone_country_code,
      customerPhoneNumber: customer.phone_number,
      orderTotal: total,
    });

    const orderId = await saveOrder(customer, items, total);

    if (!orderId) {
      logAppWarn("cart.finalize.orderFail", "Falha ao salvar pedido", { traceId });
      toast.error("Erro ao registrar o pedido. Tente novamente.");
      setFinalizing(false);
      return;
    }

    const snapshotItems = [...items];
    const snapshotTotal = total;

    /** Twilio: sempre tenta na API; a config fica no servidor (service role), pois o cliente
     *  anônimo muitas vezes não recebe chaves no `useCompanySettings`. */
    let twilioSent = false;
    const twilioResult = await sendTwilioWhatsApp(customer, snapshotItems, snapshotTotal, orderId, traceId);
    if (twilioResult.success) {
      twilioSent = true;
      logAppInfo("cart.finalize.twilio.ok", "WhatsApp enviado", {
        traceId: twilioResult.traceId,
        orderId,
      });
      toast.success("Pedido enviado para o WhatsApp da empresa! 🎉");
    } else {
      logAppWarn("cart.finalize.twilio.fail", "Falha no envio WhatsApp", {
        traceId: twilioResult.traceId,
        orderId,
        error: twilioResult.error,
        httpStatus: twilioResult.httpStatus,
      });
      if (process.env.NODE_ENV === "development") {
        console.warn("/api/whatsapp:", twilioResult.error);
      }
      if (settings?.whatsapp_notifications_enabled) {
        toast.message(
          twilioResult.error
            ? `Envio automático: ${twilioResult.error} — use o link manual no próximo passo, se quiser.`
            : "Envio automático ao WhatsApp não disponível — use o link abaixo.",
          { duration: 6000 }
        );
      }
    }

    const whatsappUrl = settings
      ? getWhatsAppUrl(settings, customer, snapshotItems, snapshotTotal, orderId)
      : null;
    const emailUrl = settings
      ? getEmailUrl(settings, customer, snapshotItems, snapshotTotal, orderId)
      : null;

    setPendingOrder({
      orderId,
      customer,
      items: snapshotItems,
      total: snapshotTotal,
      whatsappUrl,
      emailUrl,
      twilioSent,
    });

    await clearCart();
    setOpen(false);
    setFinalizing(false);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setPendingOrder(null);
  };

  return (
    <>
      <CustomerRegisterModal
        open={registerOpen}
        onClose={() => {
          setRegisterOpen(false);
          if (customer) setOpen(true);
        }}
      />

      {pendingOrder && (
        <OrderConfirmationModal
          open={confirmOpen}
          onClose={handleConfirmClose}
          orderId={pendingOrder.orderId}
          customer={pendingOrder.customer}
          items={pendingOrder.items}
          total={pendingOrder.total}
          whatsappUrl={pendingOrder.whatsappUrl}
          emailUrl={pendingOrder.emailUrl}
          twilioSent={pendingOrder.twilioSent}
        />
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="relative gap-2"
            onClick={(e) => {
              if (!customer) {
                e.preventDefault();
                setRegisterOpen(true);
              }
            }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrinho</span>
            {itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {itemCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>

        <SheetContent className="flex flex-col w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Meu Carrinho
              {itemCount > 0 && (
                <Badge variant="secondary">
                  {itemCount} {itemCount === 1 ? "item" : "itens"}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {customer && (
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span className="font-medium">{customer.full_name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-muted-foreground"
                onClick={() => {
                  clearCustomer();
                  clearCart();
                  setOpen(false);
                }}
              >
                <LogOut className="h-3 w-3" /> Sair
              </Button>
            </div>
          )}

          <Separator />

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <Package className="h-16 w-16 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Ver produtos
              </Button>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-3 py-2">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      onRemove={() => removeItem(item.id)}
                      onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
                      onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
                    />
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-bold text-lg text-primary">
                    {total.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>

                <NotificationInfo settings={settings} />

                <Button
                  className="w-full gap-2"
                  size="lg"
                  onClick={handleFinalize}
                  disabled={finalizing}
                >
                  {finalizing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Finalizar Pedido
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-muted-foreground"
                  onClick={clearCart}
                  disabled={finalizing}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Limpar carrinho
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

function NotificationInfo({
  settings,
}: {
  settings: ReturnType<typeof useCompanySettings>["settings"];
}) {
  if (!settings) return null;
  const hasTwilio = hasTwilioConfigured(settings);
  const twilioLikelyOnServer =
    !hasTwilio && settings.whatsapp_notifications_enabled;
  const hasWhatsApp = settings.whatsapp_notifications_enabled && settings.whatsapp_number;
  const hasEmail = settings.email_notifications_enabled && settings.order_email;
  if (!hasTwilio && !twilioLikelyOnServer && !hasWhatsApp && !hasEmail) return null;

  return (
    <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
      <p className="font-medium text-foreground/70 mb-1">
        {hasTwilio
          ? "O pedido será enviado automaticamente via:"
          : twilioLikelyOnServer
            ? "Ao finalizar, tentaremos enviar ao seu WhatsApp automaticamente. Você também poderá compartilhar o pedido via:"
            : "Ao finalizar, você poderá enviar o pedido via:"}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(hasTwilio || twilioLikelyOnServer) && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 font-medium">
            📱 WhatsApp (automático)
          </span>
        )}
        {!hasTwilio && !twilioLikelyOnServer && hasWhatsApp && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 font-medium">
            📱 WhatsApp
          </span>
        )}
        {hasEmail && (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 font-medium">
            ✉️ E-mail
          </span>
        )}
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItem;
  onRemove: () => void;
  onIncrease: () => void;
  onDecrease: () => void;
}

function CartItemRow({ item, onRemove, onIncrease, onDecrease }: CartItemRowProps) {
  const subtotal = (item.unit_price * item.quantity).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const attrs = [
    item.selected_color_name,
    item.selected_size_label,
    item.selected_volume_label,
  ].filter(Boolean);

  return (
    <div className="flex gap-3 rounded-lg border bg-card p-3">
      <div className="h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
        {item.product?.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product?.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground/40" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 min-w-0">
        <p className="text-sm font-medium leading-tight line-clamp-1">
          {item.product?.name ?? "Produto"}
        </p>

        {attrs.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {attrs.map((attr, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {attr}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {item.unit_price.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}{" "}
          / un.
        </p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={onDecrease}>
              <Minus className="h-3 w-3" />
            </Button>
            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={onIncrease}>
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-primary">{subtotal}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={onRemove}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
