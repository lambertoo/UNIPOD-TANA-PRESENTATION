#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "Starting Visitor Counter System..."

echo "[1/3] Starting camera daemon..."
python backend/camera_daemon.py "$@" &
CAMERA_PID=$!

echo "[2/3] Starting API server on http://localhost:8000..."
python -m uvicorn backend.api_server:app --host 0.0.0.0 --port 8000 &
API_PID=$!

echo "[3/3] Starting dashboard on http://localhost:3000..."
cd dashboard && npm run dev &
DASH_PID=$!
cd "$SCRIPT_DIR"

cleanup() {
    echo ""
    echo "Shutting down..."
    kill $CAMERA_PID $API_PID $DASH_PID 2>/dev/null
    wait $CAMERA_PID $API_PID $DASH_PID 2>/dev/null
    echo "All processes stopped."
}

trap cleanup EXIT INT TERM

echo ""
echo "All services running:"
echo "  Dashboard: http://localhost:3000"
echo "  API:       http://localhost:8000"
echo "  Camera:    PID $CAMERA_PID"
echo ""
echo "Press Ctrl+C to stop all services."

wait
