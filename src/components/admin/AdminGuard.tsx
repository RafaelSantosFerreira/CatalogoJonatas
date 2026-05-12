
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { withTimeout } from "@/lib/with-timeout";
import { logAppError } from "@/lib/app-logger";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, session, loading, signOut } = useAuth();
  const router = useRouter();
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function validateAdminAccess() {
      if (loading) return;

      if (!user || !session?.access_token) {
        setCheckingAccess(false);
        router.replace("/admin/login");
        return;
      }

      if (!user?.email_confirmed_at) {
        await signOut();
        if (!cancelled) {
          setCheckingAccess(false);
          router.replace("/admin/login");
        }
        return;
      }

      try {
        const res = await withTimeout(
          fetch("/api/admin-access", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }),
          18_000
        );
        if (!res) {
          logAppError("AdminGuard.admin-access", new Error("Timeout (18s) em /api/admin-access"));
          await signOut();
          if (!cancelled) {
            setCheckingAccess(false);
            router.replace("/admin/login?reason=timeout");
          }
          return;
        }
        if (!res.ok) {
          await signOut();
          if (!cancelled) {
            setCheckingAccess(false);
            router.replace("/admin/login?reason=access_denied");
          }
          return;
        }
      } catch (e) {
        logAppError("AdminGuard.admin-access.fetch", e);
        await signOut();
        if (!cancelled) {
          setCheckingAccess(false);
          router.replace("/admin/login?reason=network");
        }
        return;
      }

      if (!cancelled) setCheckingAccess(false);
    }

    void validateAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [user, session, loading, router, signOut]);

  if (loading || checkingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
