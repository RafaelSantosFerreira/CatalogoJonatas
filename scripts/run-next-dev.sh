#!/usr/bin/env bash
# Sobe o limite de arquivos abertos (ajuda Watchpack/EMFILE no macOS) e delega ao Next local.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f "./node_modules/.bin/next" ]]; then
  echo "Erro: node_modules/.bin/next nao encontrado. Rode: npm install" >&2
  exit 1
fi

if command -v ulimit >/dev/null 2>&1; then
  ulimit -n 65536 2>/dev/null || ulimit -n 10240 2>/dev/null || true
fi

# Watchpack com polling (menos FD que inotify macOS); evita GET / 404 quando EMFILE falha.
export WATCHPACK_POLLING="${WATCHPACK_POLLING:-1}"

echo "Iniciando Next.js... (a primeira compilacao pode levar ~10–30 s)"
echo "Abra a URL \"Local\" que aparecer abaixo — se a porta 3000 estiver ocupada, sera outra (ex.: 3006)."
exec ./node_modules/.bin/next "$@"
