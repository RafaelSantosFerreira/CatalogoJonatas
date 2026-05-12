
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import GlobalClientEffects from "@/components/GlobalClientEffects";
import { AppRootErrorBoundary } from "@/components/AppRootErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { CustomerProvider } from "@/context/CustomerContext";
import { CartProvider } from "@/context/CartContext";
import { supabaseAdmin, supabaseAdminConfigured } from "@/integrations/supabase/server";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const DEFAULT_APP_NAME = "Ferragem Pro";
const DEFAULT_DESCRIPTION = "Catálogo de produtos para ferragem com gestão completa";

const METADATA_DB_MS = 4000;

async function getAppNameForMetadata(): Promise<string> {
  if (!supabaseAdminConfigured) return DEFAULT_APP_NAME;
  try {
    const data = await Promise.race([
      supabaseAdmin
        .from("company_settings")
        .select("company_name")
        .maybeSingle()
        .then((r) => r.data ?? null),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), METADATA_DB_MS);
      }),
    ]);
    const dynamicName = (data?.company_name || "").trim();
    return dynamicName || DEFAULT_APP_NAME;
  } catch {
    return DEFAULT_APP_NAME;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getAppNameForMetadata();
  return {
    title: `${appName} — Catálogo de Produtos`,
    description: `Catálogo de produtos da ${appName}`,
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Toaster />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "theme-ocean", "theme-forest", "theme-violet"]}
          value={{
            light: "light",
            dark: "dark",
            "theme-ocean": "theme-ocean",
            "theme-forest": "theme-forest",
            "theme-violet": "theme-violet",
          }}
        >
          <AuthProvider>
            <CustomerProvider>
              <CartProvider>
                <AppRootErrorBoundary>{children}</AppRootErrorBoundary>
                <GlobalClientEffects />
              </CartProvider>
            </CustomerProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
