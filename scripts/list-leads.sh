#!/usr/bin/env bash
# List captured chatbot leads from the ccwork-leads R2 bucket, newest last.
#
# Auth: needs a Cloudflare API token with R2 read. Uses $CLOUDFLARE_API_TOKEN
# if set, otherwise falls back to /root/.cf_token (CT105). The token is never
# stored in this repo.
#
# Usage:  ./scripts/list-leads.sh
set -euo pipefail

ACCOUNT_ID="002dd2f758b67ac08d05a3809d65a25a"
BUCKET="ccwork-leads"
TOKEN="${CLOUDFLARE_API_TOKEN:-$(cat /root/.cf_token 2>/dev/null || true)}"

if [ -z "$TOKEN" ]; then
  echo "No token. Set CLOUDFLARE_API_TOKEN (needs R2 read) and retry." >&2
  exit 1
fi

API="https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}"

keys=$(curl -s "${API}/objects" -H "Authorization: Bearer ${TOKEN}" \
  | python3 -c "import json,sys; print('\n'.join(sorted(o['key'] for o in json.load(sys.stdin)['result'])))")

if [ -z "$keys" ]; then
  echo "No leads yet."
  exit 0
fi

count=$(printf '%s\n' "$keys" | grep -c . || true)
echo "== ${count} lead(s) =="
while IFS= read -r k; do
  [ -z "$k" ] && continue
  curl -s "${API}/objects/${k}" -H "Authorization: Bearer ${TOKEN}" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"- {d.get('created_at','?')}  {d.get('name','?')}  <{d.get('email','?')}>\")"
done <<< "$keys"
