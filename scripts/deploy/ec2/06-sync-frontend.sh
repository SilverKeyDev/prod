#!/usr/bin/env bash
# EC2 deploy step 6: Sync static frontend from container to /var/www/html.
set -euo pipefail

echo "$(date -u +'%Y-%m-%dT%H:%M:%SZ') Step 6: Syncing static frontend..."

sudo mkdir -p /var/www/html
if timeout 5s sudo docker exec cre_app test -d /app/Client/dist; then
  timeout 20s bash -c \
    'sudo docker exec cre_app sh -lc "cd /app/Client/dist && tar -cf - ." | sudo tar -C /var/www/html -xf -' \
    >/dev/null 2>&1 || echo "Frontend export timed out or failed (continuing)"
  sudo chown -R www-data:www-data /var/www/html >/dev/null 2>&1 || true
else
  echo "/app/Client/dist not found in container; skipping export."
fi

echo "Step 6 complete: Frontend synced."
