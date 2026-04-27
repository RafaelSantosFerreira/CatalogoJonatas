
"use client";

import { useState } from "react";
import { CheckCircle2, MessageCircle, Mail, ExternalLink, Copy, Check, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CartItem } from "@/types/cart";
import type { Customer } from "@/types/customer";

interface OrderConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  orderId: string;
  customer: Customer;
  items: CartItem[];
  total: number;
  whatsappUrl: string | null;
  emailUrl: string | null;
  twilioSent?: boolean;
  showPrices?: boolean;
}

export function OrderConfirmationModal({
  open,
  onClose,
  orderId,
  customer,
  items,
  total,
  whatsappUrl,
  emailUrl,
  twilioSent = false,
  showPrices = true,
}: OrderConfirmationModalProps) {
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortId = `#${orderId.slice(0, 8).toUpperCase()}`;

  const handleWhatsApp = () => {
    if (!whatsappUrl) return;
    window.open(whatsappUrl, "_blank");
    setWhatsappSent(true);
  };

  const handleEmail = () => {
    if (!emailUrl) return;
    window.open(emailUrl, "_blank");
    setEmailSent(true);
  };

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(shortId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalFormatted = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Pedido Realizado!</DialogTitle>
              <DialogDescription className="text-xs">
                {twilioSent
                  ? "Pedido enviado automaticamente via WhatsApp para a ferragem."
                  : "Envie o pedido por WhatsApp e/ou e-mail para a ferragem."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Twilio auto-sent banner */}
          {twilioSent && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-3 py-2.5">
              <Zap className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
              <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                Mensagem enviada automaticamente via WhatsApp (Twilio) ✓
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Número do pedido</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-xs">{shortId}</Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyId}>
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <span className="font-medium">{customer.full_name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Telefone</span>
              <span className="font-medium">
                {customer.phone_country_code} {customer.phone_number}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Itens do pedido
            </p>
            <ScrollArea className="max-h-40">
              <div className="space-y-1.5">
                {items.map((item) => {
                  const attrs = [
                    item.selected_color_name,
                    item.selected_size_label,
                    item.selected_volume_label,
                  ]
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <div
                      key={item.id}
                      className="rounded-md bg-muted/30 px-2.5 py-1.5 space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate flex-1 mr-2 font-medium">
                          {item.product?.name ?? "Produto"}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {item.quantity}x{" "}
                          {showPrices && (
                            <span className="text-foreground font-medium">
                              {(item.unit_price * item.quantity).toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </span>
                          )}
                        </span>
                      </div>
                      {attrs && (
                        <p className="text-xs text-muted-foreground">{attrs}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            {showPrices && (
              <div className="flex items-center justify-between pt-1 font-semibold text-sm">
                <span>Total</span>
                <span className="text-primary text-base">{totalFormatted}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Manual send options — shown even if Twilio sent, as fallback */}
          {(whatsappUrl || emailUrl) && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {twilioSent ? "Reenviar manualmente (opcional)" : "Enviar pedido para a ferragem"}
              </p>

              {whatsappUrl && (
                <Button
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleWhatsApp}
                  variant={twilioSent ? "outline" : "default"}
                >
                  <MessageCircle className="h-4 w-4" />
                  {whatsappSent ? (
                    <>
                      <Check className="h-4 w-4" /> WhatsApp aberto!
                    </>
                  ) : (
                    <>
                      {twilioSent ? "Reenviar via WhatsApp" : "Enviar via WhatsApp"}
                      <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
                    </>
                  )}
                </Button>
              )}

              {emailUrl && (
                <Button variant="outline" className="w-full gap-2" onClick={handleEmail}>
                  <Mail className="h-4 w-4" />
                  {emailSent ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" /> E-mail aberto!
                    </>
                  ) : (
                    <>
                      Enviar por E-mail
                      <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-60" />
                    </>
                  )}
                </Button>
              )}
            </div>
          )}

          {!whatsappUrl && !emailUrl && !twilioSent && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhum canal de notificação configurado pelo administrador.
            </p>
          )}

          <Button variant="ghost" className="w-full text-sm" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
