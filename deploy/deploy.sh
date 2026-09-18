#!/usr/bin/env bash
# One-shot deploy of AIS PWA on this VPS. Run as root from the repo root.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "1/5 deps"; npm install --omit=dev --no-audit --no-fund

echo "2/5 systemd service"
install -m644 deploy/ais-pwa.service /etc/systemd/system/ais-pwa.service
systemctl daemon-reload
systemctl enable --now ais-pwa.service
systemctl is-active ais-pwa.service

echo "3/5 DNS (needs CF_TOKEN with Zone:DNS:Edit on example.com)"
if [ -n "${CF_TOKEN:-}" ]; then deploy/cf-dns-record.sh; else
  echo "  skipped — set CF_TOKEN or add the A record ais -> $(curl -s https://api.ipify.org) in the CF dashboard (DNS-only)"; fi

echo "4/5 TLS cert (HTTP-01 webroot)"
mkdir -p /var/www/letsencrypt
# temporary HTTP vhost so the challenge is reachable before the HTTPS block exists
cat >/etc/nginx/sites-available/ais.example.com <<NGINX
server { listen 80; server_name ais.example.com;
  location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
  location / { return 200 'provisioning'; } }
NGINX
ln -sf /etc/nginx/sites-available/ais.example.com /etc/nginx/sites-enabled/ais.example.com
nginx -t && systemctl reload nginx
certbot certonly --webroot -w /var/www/letsencrypt -d ais.example.com \
  --non-interactive --agree-tos -m you@example.com

echo "5/5 final vhost"
install -m644 deploy/ais.example.com.nginx /etc/nginx/sites-available/ais.example.com
nginx -t && systemctl reload nginx
echo "done -> https://ais.example.com"
