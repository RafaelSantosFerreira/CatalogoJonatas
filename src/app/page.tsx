
import { Suspense } from "react";
import CatalogPage from "@/components/CatalogPage";

export default function Home() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><span className="text-muted-foreground">Carregando...</span></div>}>
      <CatalogPage />
    </Suspense>
  );
}
