#!/bin/bash
# One-click start script for personal-space project
# Usage: ./start.sh

cd "$(dirname "$0")"

PID_FILE="$(pwd)/.dev.pid"

# Check if already running
if [ -f "$PID_FILE" ]; then
  ALIVE=0
  while read -r PID; do
    if kill -0 "$PID" 2>/dev/null; then
      echo "[WARN] Dev server already running (PID: $PID)"
      echo "  Run ./stop.sh first, or restart with: ./stop.sh && ./start.sh"
      ALIVE=1
    fi
  done < "$PID_FILE"
  if [ "$ALIVE" -eq 1 ]; then
    exit 1
  fi
  rm -f "$PID_FILE"
fi

echo "========================================="
echo "  Starting Personal Space Project"
echo "========================================="
echo ""

# Check if node_modules exist
if [ ! -d "node_modules" ]; then
  echo "[INFO] Installing root dependencies..."
  npm install
fi

if [ ! -d "frontend/node_modules" ]; then
  echo "[INFO] Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
  echo "[INFO] Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

echo ""
echo "[INFO] Starting backend and frontend..."
echo "  Backend  -> http://localhost:3000"
echo "  Frontend -> http://localhost:5173"
echo ""

# Run concurrently in background
npm run dev &
DEV_PID=$!

# Save PID
echo "$DEV_PID" > "$PID_FILE"

echo "[INFO] Dev server started (PID: $DEV_PID)"
echo "  PID saved to .dev.pid"
echo ""
echo "  To stop: ./stop.sh"
echo ""

# Wait for the background process
wait $DEV_PID
