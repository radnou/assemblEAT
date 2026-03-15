#!/bin/bash
# =============================================
# AssemblEat — Firewall Setup (ufw)
# Run once on the OVH VPS as a user with sudo access.
# Allows only SSH, HTTP, HTTPS. All other ingress blocked.
# =============================================
set -euo pipefail

echo "=== Configuring ufw firewall ==="

sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH — keep access open before enabling
sudo ufw allow 22/tcp

# Web traffic
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable (--force skips interactive confirmation)
sudo ufw --force enable

sudo ufw status verbose
echo "=== Firewall setup complete ==="
