# Visitor Counter with AI

Offline visitor counting and identification system using an Intel RealSense depth camera and TensorFlow. Detects people crossing a doorway, captures their photo, classifies gender, and tracks who is currently inside or outside the building using face re-identification.

## Architecture

Two independent processes communicate through a shared SQLite database:

- **Camera Daemon** (`backend/camera_daemon.py`) — Reads Intel RealSense frames, runs face detection (MTCNN), extracts face embeddings (InceptionResNetV2), classifies gender, tracks people crossing a virtual doorway line using depth data, and writes events to SQLite.
- **API Server** (`backend/api_server.py`) — FastAPI server providing REST endpoints and WebSocket for real-time event streaming.
- **Dashboard** (`dashboard/`) — Next.js web app displaying live visitor counts, event feed, hourly traffic charts, gender distribution, and visitor management.

## Prerequisites

- Python 3.10+
- Node.js 20+
- Intel RealSense camera (D400 series recommended)
- Intel RealSense SDK 2.0

## Setup

### 1. Python Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Next.js Dashboard

```bash
cd dashboard
npm install
```

### 3. Configuration

Edit `config.yaml` in the project root to adjust:

| Section | Key | Description |
|---------|-----|-------------|
| `realsense` | `width`, `height`, `fps` | Camera resolution and framerate |
| `crossing_line` | `y_position` | Pixel row for the virtual doorway line |
| `crossing_line` | `direction_threshold` | Minimum depth change (mm) to confirm direction |
| `face_detection` | `confidence_threshold` | Minimum confidence to accept a face detection |
| `re_identification` | `similarity_threshold` | Cosine similarity threshold for matching returning visitors |
| `paths` | `database`, `photos` | Storage locations |

## Running

### All Services (Recommended)

```bash
chmod +x start.sh
./start.sh
```

Pass `--debug` to show a live camera window with bounding boxes and crossing line:

```bash
./start.sh --debug
```

### Individual Services

```bash
# Camera daemon
python backend/camera_daemon.py --debug

# API server
python -m uvicorn backend.api_server:app --host 0.0.0.0 --port 8000

# Dashboard
cd dashboard && npm run dev
```

## Accessing the Dashboard

Open http://localhost:3000 in your browser.

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | `/` | Live counter, event feed, hourly chart, gender chart |
| Visitors | `/visitors` | All registered visitors with status |
| Visitor Detail | `/visitors/[id]` | Individual visitor photo and event timeline |

## API Endpoints

Base URL: `http://localhost:8000`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/visitors` | All registered visitors |
| GET | `/api/visitors/{id}` | Visitor detail with event history |
| GET | `/api/visitors/{id}/photo` | Visitor face photo |
| GET | `/api/events` | Crossing events (filterable: `visitor_id`, `date`, `direction`, `limit`) |
| GET | `/api/stats` | Current counts and gender distribution |
| GET | `/api/stats/hourly` | Hourly entry/exit counts (filterable: `date`) |
| GET | `/api/health` | System health check |
| WS | `/ws/events` | Real-time crossing event stream |

## How It Works

1. The RealSense camera captures aligned color + depth frames at 30fps
2. MTCNN detects faces in each color frame
3. A centroid tracker (Hungarian algorithm) maintains identity across frames
4. When a tracked face crosses the virtual line, direction is determined using depth change:
   - Depth decreasing = moving toward camera = **entering**
   - Depth increasing = moving away = **exiting**
5. The face embedding is compared against all known visitors (cosine similarity)
   - Match above 0.7 threshold → returning visitor
   - No match → new visitor registered with photo
6. Events are written to SQLite, and the WebSocket pushes them to the dashboard in real-time

## Project Structure

```
visitor-counter/
├── backend/
│   ├── camera_daemon.py          # Camera + TF inference pipeline
│   ├── api_server.py             # FastAPI REST + WebSocket server
│   ├── config.py                 # Configuration loader
│   ├── database.py               # SQLite operations
│   ├── models/
│   │   ├── face_detector.py      # MTCNN face detection
│   │   ├── face_embedder.py      # Face embedding extraction
│   │   └── gender_classifier.py  # Gender classification CNN
│   ├── tracking/
│   │   ├── centroid_tracker.py   # Multi-face centroid tracker
│   │   └── crossing_detector.py  # Virtual line crossing detection
│   └── requirements.txt
├── dashboard/                    # Next.js web dashboard
│   ├── src/app/                  # Pages (App Router)
│   ├── src/components/           # React components
│   └── src/lib/                  # API client, WebSocket hook
├── data/                         # Created at runtime
│   ├── photos/                   # Captured face photos
│   └── visitor_counter.db        # SQLite database
├── config.yaml                   # System configuration
├── start.sh                      # Launch all services
└── docs/DESIGN.md                # Full system design document
```

## Gender Classification Model

The gender classifier ships with random weights (architecture only). To use a pre-trained model:

1. Place your trained weights file at `backend/models/gender_weights.h5`
2. The classifier will automatically load them on startup via `load_pretrained_weights()`

Training your own model or using a pre-trained one from an open-source repository is recommended for accurate gender classification.

## Privacy

- All data stays on the local machine — no network transmission
- Photos are stored on the local filesystem only
- Face embeddings are numerical vectors (not reversible to a photo)
