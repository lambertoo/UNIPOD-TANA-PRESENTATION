# Visitor Counter with AI — System Design

## Overview

An offline visitor counting and identification system using an Intel RealSense depth camera, TensorFlow-based face detection/classification, and a local web dashboard. The system detects people crossing a virtual doorway line, captures their photo, classifies gender from facial features, and tracks who is currently inside or outside the building using face re-identification.

## Architecture

Two independent processes communicating through a shared SQLite database:

```
┌──────────────────────────┐     ┌──────────────────────────────┐
│   CAMERA DAEMON (Python) │     │   API + DASHBOARD            │
│                          │     │                              │
│  Intel RealSense ──►     │     │  FastAPI (REST + WebSocket)  │
│  Frame Capture   ──►     │     │       ▲            ▲         │
│  Face Detection (TF) ──► │     │       │            │         │
│  Gender Classification ──►SQLite◄──── REST ──── WebSocket     │
│  Embedding Extraction ──►│     │       │            │         │
│  Crossing Line Tracker ──►     │       ▼            ▼         │
│  Photo Capture ──► /photos│     │  Next.js Dashboard (Browser) │
└──────────────────────────┘     └──────────────────────────────┘
```

- **Camera daemon** writes to SQLite and saves face photos to `data/photos/`
- **FastAPI** reads SQLite, serves REST API on `localhost:8000`
- **WebSocket** pushes real-time crossing events to the browser
- **Next.js** dashboard runs on `localhost:3000`

## Process 1: Camera Daemon

### Pipeline (continuous loop)

1. **Frame Capture**: Read aligned color + depth frames from Intel RealSense via `pyrealsense2`
2. **Face Detection**: MTCNN (or BlazeFace) model detects face bounding boxes in the color frame
3. **Face Embedding**: FaceNet/ArcFace extracts a 512-dimensional embedding vector per detected face
4. **Gender Classification**: Lightweight CNN classifies gender from the face crop (male/female + confidence)
5. **Crossing Line Detection**:
   - A configurable virtual line is drawn across the camera's field of view (at the doorway)
   - A centroid tracker follows each detected face across consecutive frames
   - When a tracked centroid crosses the line, direction is determined:
     - Movement toward the camera (depth decreasing) → **entering**
     - Movement away from the camera (depth increasing) → **exiting**
   - The RealSense depth channel makes direction detection more reliable than 2D-only tracking
6. **Re-identification**: Compare the face embedding against all known visitors using cosine similarity. If best match > 0.7 threshold → returning visitor. Otherwise → register new visitor.
7. **Event Recording**: On each crossing, write to SQLite and save face photo to disk.

### Configuration

All tunable parameters live in `config.yaml`:

```yaml
realsense:
  width: 640
  height: 480
  fps: 30

crossing_line:
  y_position: 240        # pixel row for the virtual line
  direction_threshold: 20 # min depth change (mm) to confirm direction

face_detection:
  confidence_threshold: 0.85
  min_face_size: 40       # pixels

re_identification:
  similarity_threshold: 0.7
  embedding_dimension: 512

gender_classification:
  confidence_threshold: 0.6
```

## Process 2: FastAPI Backend

### REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/visitors` | List all registered visitors (with current inside/outside status) |
| GET | `/api/visitors/{id}` | Single visitor detail + event history |
| GET | `/api/visitors/{id}/photo` | Serve visitor photo |
| GET | `/api/events` | List crossing events (filterable by date, direction) |
| GET | `/api/stats` | Aggregate stats: total inside, total today, gender breakdown |
| GET | `/api/stats/hourly` | Hourly entry/exit counts for charts |
| PUT | `/api/config` | Update crossing line and threshold config |
| GET | `/api/health` | System health: camera status, DB size, uptime |

### WebSocket

- **`ws://localhost:8000/ws/events`** — Pushes real-time events as JSON:
  ```json
  {
    "type": "crossing",
    "visitor_id": 42,
    "direction": "enter",
    "gender": "male",
    "confidence": 0.92,
    "timestamp": "2026-05-21T10:30:00",
    "photo_url": "/api/visitors/42/photo"
  }
  ```

## Process 3: Next.js Dashboard

### Pages

- **`/` (Dashboard)**: Live counter showing people currently inside. Real-time event feed. Gender distribution pie chart. Hourly traffic bar chart.
- **`/visitors`**: Table of all registered visitors with photo thumbnail, gender, first seen date, last seen date, current status (inside/outside).
- **`/visitors/[id]`**: Individual visitor detail — full photo, all crossing events as a timeline.
- **`/settings`**: Configure crossing line position, detection thresholds. View camera health status.

### Tech Stack

- Next.js (App Router)
- Tailwind CSS for styling
- Recharts for charts
- WebSocket client for real-time updates

## Database Schema (SQLite)

```sql
CREATE TABLE visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gender TEXT NOT NULL,               -- 'male' or 'female'
    gender_confidence REAL NOT NULL,
    face_embedding BLOB NOT NULL,       -- 512-dim float32 vector
    photo_filename TEXT NOT NULL,
    first_seen_at TEXT NOT NULL,         -- ISO 8601
    last_seen_at TEXT NOT NULL,
    is_inside INTEGER NOT NULL DEFAULT 0 -- 1 = inside, 0 = outside
);

CREATE TABLE crossing_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor_id INTEGER NOT NULL REFERENCES visitors(id),
    direction TEXT NOT NULL,            -- 'enter' or 'exit'
    timestamp TEXT NOT NULL,            -- ISO 8601
    confidence REAL NOT NULL,
    photo_filename TEXT NOT NULL
);

CREATE INDEX idx_events_visitor ON crossing_events(visitor_id);
CREATE INDEX idx_events_timestamp ON crossing_events(timestamp);
CREATE INDEX idx_visitors_inside ON visitors(is_inside);
```

## Directory Structure

```
visitor-counter/
├── backend/
│   ├── camera_daemon.py          # Process 1: camera + TF pipeline
│   ├── api_server.py             # Process 2: FastAPI + WebSocket
│   ├── models/
│   │   ├── face_detector.py      # MTCNN face detection wrapper
│   │   ├── gender_classifier.py  # Gender classification model
│   │   └── face_embedder.py      # FaceNet/ArcFace embedding extractor
│   ├── tracking/
│   │   ├── centroid_tracker.py   # Multi-face centroid tracker
│   │   └── crossing_detector.py  # Virtual line crossing logic
│   ├── database.py               # SQLite operations
│   ├── config.py                 # Load/validate config.yaml
│   └── requirements.txt
├── dashboard/
│   ├── src/app/                  # Next.js App Router pages
│   ├── src/components/           # React components
│   ├── src/lib/                  # API client, WebSocket hook
│   ├── package.json
│   └── tailwind.config.ts
├── data/
│   ├── photos/                   # Captured face photos
│   └── visitor_counter.db        # SQLite database
├── config.yaml                   # Shared configuration
├── start.sh                      # Launch script for both processes
└── README.md
```

## Startup

`start.sh` launches both processes:

```bash
#!/bin/bash
python backend/camera_daemon.py &
CAMERA_PID=$!
python -m uvicorn backend.api_server:app --host 0.0.0.0 --port 8000 &
API_PID=$!
cd dashboard && npm run dev &
DASH_PID=$!
trap "kill $CAMERA_PID $API_PID $DASH_PID" EXIT
wait
```

## Dependencies

### Python (backend/requirements.txt)
- `pyrealsense2` — Intel RealSense SDK
- `tensorflow` — Face detection, gender classification, embedding models
- `opencv-python` — Image processing
- `mtcnn` — Face detection model
- `fastapi` — REST API framework
- `uvicorn` — ASGI server
- `websockets` — WebSocket support
- `numpy` — Numerical operations
- `scipy` — Cosine similarity for embeddings
- `pyyaml` — Config file parsing

### Node.js (dashboard/package.json)
- `next` — React framework
- `react` / `react-dom`
- `tailwindcss` — Styling
- `recharts` — Charts
- `@tanstack/react-query` — Data fetching

## Error Handling

- If the RealSense camera disconnects, the daemon logs the error and retries every 5 seconds
- If SQLite is locked (concurrent write), use WAL mode and retry with exponential backoff
- If face detection fails on a frame, skip it and continue to the next frame
- The dashboard shows a "Camera Offline" banner when the health endpoint reports the camera is down

## Privacy Considerations

- All data stays on the local machine — no network transmission
- Photos are stored on the local filesystem only
- Face embeddings are numerical vectors (not reversible to a photo)
- The settings page includes a "Purge All Data" button
