#!/usr/bin/env bash
# Production deploy (requires: brew install vercel-cli && vercel login)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/web"
/opt/homebrew/bin/vercel deploy --prod --yes
