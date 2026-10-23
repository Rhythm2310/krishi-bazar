#!/bin/bash
set -euo pipefail

bun install --frozen-lockfile
bun run typecheck
bun test
bun run build

# Start preview server in background
bun run preview -- --port 4173 --strictPort &
SERVER_PID=$!

# Wait for server to be ready (poll up to 15s)
MAX_ATTEMPTS=15
ATTEMPT=0
READY=false

echo "Waiting for server on port 4173..."
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -fsS http://localhost:4173/ | grep -q 'id="root"'; then
    READY=true
    break
  fi
  sleep 1
  ATTEMPT=$((ATTEMPT + 1))
done

# Kill server
kill $SERVER_PID || true
wait $SERVER_PID 2>/dev/null || true

if [ "$READY" = "true" ]; then
  echo "SMOKE OK"
  exit 0
else
  echo "Smoke test failed: Server did not respond with expected content"
  exit 1
fi
