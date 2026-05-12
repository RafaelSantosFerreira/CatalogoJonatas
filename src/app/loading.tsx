export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 px-4">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" aria-hidden />
      <p className="text-sm text-muted-foreground text-center">Carregando…</p>
    </div>
  );
}
