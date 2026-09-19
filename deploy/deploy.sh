#!/usr/bin/env bash
# One-shot deploy of the AIS PWA on a fresh Debian/Ubuntu box, as root, from the
# repository root. Everything that is specific to an instance comes from the
# environment, so this script is the same for everyone who runs it:
#
#   DOMAIN=ais.example.com LE_EMAIL=you@example.com deploy/deploy.sh
#
# Optional:
#   PORT=4173            what the app listens on behind nginx (default 4173)
#   CF_TOKEN=...         Cloudflare token with Zone:DNS:Edit, to create the A record
#   AIS_GA_ID=G-XXXXXXX  analytics for this instance; written to /etc/default/ais-pwa
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${DOMAIN:?set DOMAIN, e.g. DOMAIN=ais.example.com}"
LE_EMAIL="${LE_EMAIL:?set LE_EMAIL — Let's Encrypt needs an address for expiry notices}"
PORT="${PORT:-4173}"

echo "1/6 deps"
npm install --omit=dev --no-audit --no-fund

echo "2/6 instance environment"
# Kept outside the repository on purpose: an analytics id belongs to whoever runs
# the instance, and the unit file reads this optionally.
umask 077
{
  echo "PORT=${PORT}"
  [ -n "${AIS_GA_ID:-}" ] && echo "AIS_GA_ID=${AIS_GA_ID}"
} >/etc/default/ais-pwa
umask 022

echo "3/6 systemd service"
sed "s#__WORKDIR__#$(pwd)#" deploy/ais-pwa.service >/etc/systemd/system/ais-pwa.service
chmod 644 /etc/systemd/system/ais-pwa.service
systemctl daemon-reload
systemctl enable --now ais-pwa.service
systemctl is-active ais-pwa.service

echo "4/6 DNS"
if [ -n "${CF_TOKEN:-}" ]; then
  deploy/cf-dns-record.sh
else
  echo "  skipped — point ${DOMAIN} at $(curl -s https://api.ipify.org) yourself."
  echo "  If you use Cloudflare, keep the record DNS-only until the certificate is issued:"
  echo "  a proxied record breaks the HTTP-01 challenge."
fi

echo "5/6 TLS certificate (HTTP-01, webroot)"
mkdir -p /var/www/letsencrypt
# A temporary HTTP vhost so the challenge is reachable before the HTTPS block exists.
cat >"/etc/nginx/sites-available/${DOMAIN}" <<NGINX
server { listen 80; server_name ${DOMAIN};
  location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
  location / { return 200 'provisioning'; } }
NGINX
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t && systemctl reload nginx
certbot certonly --webroot -w /var/www/letsencrypt -d "${DOMAIN}" \
  --non-interactive --agree-tos -m "${LE_EMAIL}"

echo "6/6 final vhost"
sed -e "s/__DOMAIN__/${DOMAIN}/g" -e "s/__PORT__/${PORT}/g" \
  deploy/nginx.conf.template >"/etc/nginx/sites-available/${DOMAIN}"
nginx -t && systemctl reload nginx

echo "done -> https://${DOMAIN}"
