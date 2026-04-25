#!/usr/bin/env bash
# Create GitHub repo (vagdotdev/jini-mvp-web) if missing, set origin, push main.
# Prereq: run once:  gh auth login
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GH="/opt/homebrew/bin/gh"
if [[ ! -x "$GH" ]]; then
  echo "Install GitHub CLI: brew install gh"
  exit 1
fi

if ! "$GH" auth status &>/dev/null; then
  echo "Not logged in. In Terminal (outside Cursor is fine), run:"
  echo "  gh auth login"
  echo "Choose: GitHub.com → HTTPS → Login with a web browser."
  echo "Then re-run:  $0"
  exit 1
fi

OWNER="vagdotdev"
REPO="jini-mvp-web"

if "$GH" repo view "${OWNER}/${REPO}" &>/dev/null; then
  echo "Repo ${OWNER}/${REPO} already exists."
  if git remote get-url origin &>/dev/null; then
    echo "Remote origin present. Pushing..."
    git push -u origin main
  else
    git remote add origin "https://github.com/${OWNER}/${REPO}.git"
    git push -u origin main
  fi
else
  echo "Creating repo ${OWNER}/${REPO} and pushing..."
  "$GH" repo create "${REPO}" --public --source=. --remote=origin --push --description "Jini MVP Web — live shopping"
fi

echo "Done: https://github.com/${OWNER}/${REPO}"
