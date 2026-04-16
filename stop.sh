#!/bin/bash
# One-click stop script for personal-space project
# Usage: ./stop.sh

echo "========================================="
echo "  Stopping Personal Space Project"
echo "========================================="
echo ""

PID_FILE="$(dirname "$0")/.dev.pid"

if [ -f "$PID_FILE" ]; then
  echo "[INFO] Stopping dev processes..."
  while read -r PID; do
    if kill -0 "$PID" 2>/dev/null; then
      echo "  Killing PID: $PID"
      taskkill //PID "$PID" //T //F 2>/dev/null || kill -9 "$PID" 2>/dev/null
    fi
  done < "$PID_FILE"
  rm -f "$PID_FILE"
  echo "[DONE] All processes stopped."
else
  # Fallback: find and kill node processes related to this project
  echo "[INFO] No PID file found, searching for dev processes..."

  FOUND=0
  for PID in $(ps aux 2>/dev/null | grep -E "npm.*dev|vite|ts-node|nest" | grep -v grep | awk '{print $2}'); do
    echo "  Killing PID: $PID"
    taskkill //PID "$PID" //T //F 2>/dev/null || kill -9 "$PID" 2>/dev/null
    FOUND=1
  done

  if [ "$FOUND" -eq 0 ]; then
    echo "[INFO] No running dev processes found."
  else
    echo "[DONE] Processes stopped."
  fi
fi

echo "========================================="
