#!/usr/bin/env bash
# Create the A record for this instance, DNS-only (grey cloud), so that Let's
# Encrypt's HTTP-01 challenge can reach the origin. A proxied record breaks both
# the first issue and every renewal.
#
#   DOMAIN=ais.example.com CF_TOKEN=... deploy/cf-dns-record.sh [ip]
#
# The token needs Zone:DNS:Edit on the zone that DOMAIN belongs to.
set -euo pipefail

DOMAIN="${DOMAIN:?set DOMAIN, e.g. DOMAIN=ais.example.com}"
: "${CF_TOKEN:?export CF_TOKEN with a Cloudflare token that has Zone:DNS:Edit}"
ZONE="${ZONE:-${DOMAIN#*.}}"      # ais.example.com -> example.com
NAME="${DOMAIN%%.$ZONE}"          # ais.example.com -> ais
IP="${1:-$(curl -s https://api.ipify.org)}"

zone_id=$(curl -s -H "Authorization: Bearer $CF_TOKEN" \
  "https://api.cloudflare.com/client/v4/zones?name=${ZONE}" |
  python3 -c 'import sys,json;r=json.load(sys.stdin)["result"];print(r[0]["id"] if r else "")')
[ -n "$zone_id" ] || { echo "no such zone: ${ZONE}" >&2; exit 1; }

curl -s -X POST -H "Authorization: Bearer $CF_TOKEN" -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records" \
  -d "{\"type\":\"A\",\"name\":\"${NAME}\",\"content\":\"${IP}\",\"proxied\":false,\"ttl\":300}" |
  python3 -c 'import sys,json;d=json.load(sys.stdin);print("OK" if d["success"] else d["errors"])'
