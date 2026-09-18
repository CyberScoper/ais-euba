#!/usr/bin/env bash
# Create the A record ais.example.com -> this server, DNS-only (grey cloud),
# so Let's Encrypt HTTP-01 can reach the origin. Needs a Cloudflare API token
# with Zone:DNS:Edit on example.com in CF_TOKEN.
set -euo pipefail
: "${CF_TOKEN:?export CF_TOKEN with a Cloudflare token that has Zone:DNS:Edit on example.com}"
IP="${1:-$(curl -s https://api.ipify.org)}"
ZONE=$(curl -s -H "Authorization: Bearer $CF_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=example.com" | \
  python3 -c 'import sys,json;print(json.load(sys.stdin)["result"][0]["id"])')
curl -s -X POST -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/$ZONE/dns_records" \
  -d "{\"type\":\"A\",\"name\":\"ais\",\"content\":\"$IP\",\"proxied\":false,\"ttl\":300}" | \
  python3 -c 'import sys,json;d=json.load(sys.stdin);print("OK" if d["success"] else d["errors"])'
