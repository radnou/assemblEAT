#!/bin/bash
# =============================================
# AssemblEat — Deploy Supabase Platform to VPS
# Run from: infra/scripts/
# Prerequisites:
#   - SSH key access to ubuntu@54.38.109.182
#   - .env exists alongside docker-compose.yml
#   - gerersci_internal Docker network exists on VPS
# =============================================
set -euo pipefail

REMOTE="ubuntu@54.38.109.182"
REMOTE_DIR="/opt/supabase-platform"
LOCAL_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/../supabase-platform" && pwd)"

echo "=== [1/5] Creating remote directory ==="
ssh "$REMOTE" "sudo mkdir -p $REMOTE_DIR && sudo chown ubuntu:ubuntu $REMOTE_DIR"

echo "=== [2/5] Uploading files ==="
scp -r "$LOCAL_SRC"/* "$REMOTE:$REMOTE_DIR/"

echo "=== [3/5] Creating Docker network ==="
ssh "$REMOTE" "docker network create supabase_platform_network 2>/dev/null || echo 'Network already exists, skipping'"

echo "=== [4/5] Starting services ==="
ssh "$REMOTE" "cd $REMOTE_DIR && docker compose up -d"

echo "=== [5/5] Verifying container health ==="
sleep 10
ssh "$REMOTE" "docker ps --filter 'name=supabase_platform' --format 'table {{.Names}}\t{{.Status}}'"

echo ""
echo "=== Deployment complete ==="
echo "Next steps:"
echo "  1. Copy infra/nginx/assembleat.conf to /etc/nginx/conf.d/ on VPS"
echo "  2. Run infra/scripts/add-assembleat-domain.sh to obtain TLS certificate"
echo "  3. Reload nginx: sudo nginx -t && sudo nginx -s reload"
