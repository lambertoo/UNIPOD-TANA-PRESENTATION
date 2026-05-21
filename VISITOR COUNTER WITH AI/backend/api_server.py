import sys
import os
import time
from pathlib import Path
from datetime import datetime

project_root = str(Path(__file__).resolve().parent.parent)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
import asyncio
import json

from backend.frame_buffer import read_latest_frame_jpeg, is_camera_active

from backend.config import load_config
from backend.database import (
    initialize_database,
    get_database_connection,
    fetch_all_visitors,
    fetch_visitor_by_id,
    fetch_crossing_events,
    count_visitors_currently_inside,
    fetch_gender_distribution,
    fetch_hourly_traffic,
)

configuration = load_config()
database_path = configuration["paths"]["database"]
photos_directory = configuration["paths"]["photos"]

initialize_database(database_path)

app = FastAPI(title="Visitor Counter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

server_start_time = None


@app.on_event("startup")
async def record_server_start_time():
    global server_start_time
    server_start_time = time.time()


def serialize_visitor_row(row):
    return {
        "id": row["id"],
        "gender": row["gender"],
        "gender_confidence": row["gender_confidence"],
        "photo_filename": row["photo_filename"],
        "first_seen_at": row["first_seen_at"],
        "last_seen_at": row["last_seen_at"],
        "is_inside": bool(row["is_inside"]),
    }


def serialize_crossing_event_row(row):
    return {
        "id": row["id"],
        "visitor_id": row["visitor_id"],
        "direction": row["direction"],
        "timestamp": row["timestamp"],
        "confidence": row["confidence"],
        "photo_filename": row["photo_filename"],
    }


@app.get("/api/visitors")
async def list_all_visitors():
    connection = get_database_connection(database_path)
    try:
        visitor_rows = fetch_all_visitors(connection)
        return [serialize_visitor_row(row) for row in visitor_rows]
    finally:
        connection.close()


@app.get("/api/visitors/{visitor_id}")
async def get_visitor_detail(visitor_id: int):
    connection = get_database_connection(database_path)
    try:
        visitor_row = fetch_visitor_by_id(connection, visitor_id)
        if visitor_row is None:
            raise HTTPException(status_code=404, detail="Visitor not found")

        crossing_event_rows = fetch_crossing_events(
            connection, visitor_id=visitor_id, limit=1000
        )

        return {
            "visitor": serialize_visitor_row(visitor_row),
            "crossing_events": [
                serialize_crossing_event_row(event) for event in crossing_event_rows
            ],
        }
    finally:
        connection.close()


@app.get("/api/visitors/{visitor_id}/photo")
async def serve_visitor_photo(visitor_id: int):
    connection = get_database_connection(database_path)
    try:
        visitor_row = fetch_visitor_by_id(connection, visitor_id)
        if visitor_row is None:
            raise HTTPException(status_code=404, detail="Visitor not found")

        photo_file_path = Path(photos_directory) / visitor_row["photo_filename"]

        if not photo_file_path.exists():
            raise HTTPException(status_code=404, detail="Photo file not found")

        return FileResponse(str(photo_file_path))
    finally:
        connection.close()


@app.get("/api/events")
async def list_crossing_events(
    visitor_id: int = Query(None),
    date: str = Query(None),
    direction: str = Query(None),
    limit: int = Query(100),
):
    connection = get_database_connection(database_path)
    try:
        event_rows = fetch_crossing_events(
            connection,
            visitor_id=visitor_id,
            date=date,
            direction=direction,
            limit=limit,
        )
        return [serialize_crossing_event_row(row) for row in event_rows]
    finally:
        connection.close()


@app.get("/api/stats")
async def get_current_statistics():
    connection = get_database_connection(database_path)
    try:
        total_inside = count_visitors_currently_inside(connection)

        total_visitors_result = connection.execute(
            "SELECT COUNT(*) as total FROM visitors"
        ).fetchone()
        total_visitors = total_visitors_result["total"]

        today_date_prefix = datetime.utcnow().date().isoformat()
        total_events_today_result = connection.execute(
            "SELECT COUNT(*) as total FROM crossing_events WHERE timestamp LIKE ?",
            (f"{today_date_prefix}%",),
        ).fetchone()
        total_events_today = total_events_today_result["total"]

        gender_distribution = fetch_gender_distribution(connection)

        return {
            "total_inside": total_inside,
            "total_visitors": total_visitors,
            "total_events_today": total_events_today,
            "gender_distribution": gender_distribution,
        }
    finally:
        connection.close()


@app.get("/api/stats/hourly")
async def get_hourly_traffic_statistics(date: str = Query(None)):
    connection = get_database_connection(database_path)
    try:
        hourly_traffic_data = fetch_hourly_traffic(connection, date=date)
        return hourly_traffic_data
    finally:
        connection.close()


@app.get("/api/health")
async def check_health_status():
    connection = get_database_connection(database_path)
    try:
        database_file_size_bytes = os.path.getsize(database_path)
        database_size_megabytes = round(database_file_size_bytes / (1024 * 1024), 2)

        total_visitors_result = connection.execute(
            "SELECT COUNT(*) as total FROM visitors"
        ).fetchone()
        total_visitors = total_visitors_result["total"]

        uptime_seconds = round(time.time() - server_start_time, 2) if server_start_time else 0

        return {
            "status": "ok",
            "database_size_mb": database_size_megabytes,
            "total_visitors": total_visitors,
            "uptime_seconds": uptime_seconds,
        }
    finally:
        connection.close()


@app.get("/api/camera/stream")
async def stream_camera_feed():
    async def generate_mjpeg_frames():
        while True:
            frame_jpeg = read_latest_frame_jpeg()
            if frame_jpeg is not None:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + frame_jpeg
                    + b"\r\n"
                )
            await asyncio.sleep(0.066)

    return StreamingResponse(
        generate_mjpeg_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/api/camera/status")
async def get_camera_status():
    return {"is_active": is_camera_active()}


@app.websocket("/ws/events")
async def websocket_crossing_events_stream(websocket: WebSocket):
    await websocket.accept()

    connection = get_database_connection(database_path)
    try:
        last_seen_event_result = connection.execute(
            "SELECT MAX(id) as max_id FROM crossing_events"
        ).fetchone()
        last_seen_event_id = last_seen_event_result["max_id"] or 0
    finally:
        connection.close()

    try:
        while True:
            await asyncio.sleep(2)

            connection = get_database_connection(database_path)
            try:
                new_event_rows = connection.execute(
                    """
                    SELECT ce.*, v.gender, v.gender_confidence
                    FROM crossing_events ce
                    JOIN visitors v ON ce.visitor_id = v.id
                    WHERE ce.id > ?
                    ORDER BY ce.id ASC
                    """,
                    (last_seen_event_id,),
                ).fetchall()

                for event_row in new_event_rows:
                    event_payload = {
                        "type": "crossing",
                        "visitor_id": event_row["visitor_id"],
                        "direction": event_row["direction"],
                        "gender": event_row["gender"],
                        "confidence": event_row["gender_confidence"],
                        "timestamp": event_row["timestamp"],
                        "photo_url": f"/api/visitors/{event_row['visitor_id']}/photo",
                    }
                    await websocket.send_text(json.dumps(event_payload))
                    last_seen_event_id = event_row["id"]
            finally:
                connection.close()

    except WebSocketDisconnect:
        pass
    except Exception:
        try:
            await websocket.close()
        except Exception:
            pass
