#!/bin/bash
# =============================================
# AssemblEat — Obtain TLS Certificate
# Run directly ON the VPS (not via SSH wrapper).
# Prerequisites:
#   - DNS A record for api.assembleat.app → 54.38.109.182
#   - gerersci_certbot container is running
#   - Port 80 is reachable (certbot webroot challenge)
# =============================================
set -euo pipefail

echo "=== Requesting certificate for api.assembleat.app ==="

docker exec gerersci_certbot certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.assembleat.app \
  --email contact@assembleat.app \
  --agree-tos \
  --no-eff-email

echo ""
echo "=== Certificate issued ==="
echo "Reload nginx to apply:"
echo "  sudo nginx -t && sudo nginx -s reload"
