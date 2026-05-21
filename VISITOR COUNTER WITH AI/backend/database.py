import sqlite3
from datetime import datetime, date


def initialize_database(database_path):
    connection = get_database_connection(database_path)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gender TEXT NOT NULL,
            gender_confidence REAL NOT NULL,
            face_embedding BLOB NOT NULL,
            photo_filename TEXT NOT NULL,
            first_seen_at TEXT NOT NULL,
            last_seen_at TEXT NOT NULL,
            is_inside INTEGER NOT NULL DEFAULT 0
        )
    """)

    connection.execute("""
        CREATE TABLE IF NOT EXISTS crossing_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            visitor_id INTEGER NOT NULL,
            direction TEXT NOT NULL CHECK (direction IN ('enter', 'exit')),
            timestamp TEXT NOT NULL,
            confidence REAL NOT NULL,
            photo_filename TEXT NOT NULL,
            FOREIGN KEY (visitor_id) REFERENCES visitors (id)
        )
    """)

    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_events_visitor
        ON crossing_events (visitor_id)
    """)

    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_events_timestamp
        ON crossing_events (timestamp)
    """)

    connection.execute("""
        CREATE INDEX IF NOT EXISTS idx_visitors_inside
        ON visitors (is_inside)
    """)

    connection.commit()
    connection.close()


def get_database_connection(database_path):
    connection = sqlite3.connect(database_path)
    connection.execute("PRAGMA journal_mode=WAL")
    connection.row_factory = sqlite3.Row
    return connection


def register_new_visitor(connection, gender, gender_confidence,
                         face_embedding_bytes, photo_filename):
    current_timestamp = datetime.utcnow().isoformat()

    cursor = connection.execute(
        """
        INSERT INTO visitors
            (gender, gender_confidence, face_embedding, photo_filename,
             first_seen_at, last_seen_at, is_inside)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        """,
        (gender, gender_confidence, face_embedding_bytes, photo_filename,
         current_timestamp, current_timestamp)
    )

    connection.commit()
    return cursor.lastrowid


def record_crossing_event(connection, visitor_id, direction, confidence,
                          photo_filename):
    current_timestamp = datetime.utcnow().isoformat()
    is_inside_value = 1 if direction == "enter" else 0

    connection.execute(
        """
        INSERT INTO crossing_events
            (visitor_id, direction, timestamp, confidence, photo_filename)
        VALUES (?, ?, ?, ?, ?)
        """,
        (visitor_id, direction, current_timestamp, confidence, photo_filename)
    )

    connection.execute(
        """
        UPDATE visitors
        SET last_seen_at = ?, is_inside = ?
        WHERE id = ?
        """,
        (current_timestamp, is_inside_value, visitor_id)
    )

    connection.commit()


def find_all_visitor_embeddings(connection):
    rows = connection.execute(
        "SELECT id, face_embedding FROM visitors"
    ).fetchall()

    return [(row["id"], row["face_embedding"]) for row in rows]


def fetch_visitor_by_id(connection, visitor_id):
    return connection.execute(
        "SELECT * FROM visitors WHERE id = ?",
        (visitor_id,)
    ).fetchone()


def fetch_all_visitors(connection):
    return connection.execute(
        "SELECT * FROM visitors ORDER BY last_seen_at DESC"
    ).fetchall()


def fetch_crossing_events(connection, visitor_id=None, date=None,
                          direction=None, limit=100):
    query_clauses = []
    query_parameters = []

    if visitor_id is not None:
        query_clauses.append("visitor_id = ?")
        query_parameters.append(visitor_id)

    if date is not None:
        date_prefix = date if isinstance(date, str) else date.isoformat()
        query_clauses.append("timestamp LIKE ?")
        query_parameters.append(f"{date_prefix}%")

    if direction is not None:
        query_clauses.append("direction = ?")
        query_parameters.append(direction)

    base_query = "SELECT * FROM crossing_events"

    if query_clauses:
        where_clause = " AND ".join(query_clauses)
        base_query += f" WHERE {where_clause}"

    base_query += " ORDER BY timestamp DESC LIMIT ?"
    query_parameters.append(limit)

    return connection.execute(base_query, query_parameters).fetchall()


def count_visitors_currently_inside(connection):
    result = connection.execute(
        "SELECT COUNT(*) as visitor_count FROM visitors WHERE is_inside = 1"
    ).fetchone()

    return result["visitor_count"]


def fetch_gender_distribution(connection):
    rows = connection.execute(
        """
        SELECT gender, COUNT(*) as gender_count
        FROM visitors
        WHERE is_inside = 1
        GROUP BY gender
        """
    ).fetchall()

    gender_counts = {"male": 0, "female": 0}
    for row in rows:
        gender_label = row["gender"].lower()
        if gender_label in gender_counts:
            gender_counts[gender_label] = row["gender_count"]

    return gender_counts


def fetch_hourly_traffic(connection, date=None):
    target_date = date if date is not None else datetime.utcnow().date()
    date_prefix = (
        target_date if isinstance(target_date, str)
        else target_date.isoformat()
    )

    rows = connection.execute(
        """
        SELECT
            CAST(SUBSTR(timestamp, 12, 2) AS INTEGER) as hour,
            SUM(CASE WHEN direction = 'enter' THEN 1 ELSE 0 END) as enter_count,
            SUM(CASE WHEN direction = 'exit' THEN 1 ELSE 0 END) as exit_count
        FROM crossing_events
        WHERE timestamp LIKE ?
        GROUP BY hour
        ORDER BY hour
        """,
        (f"{date_prefix}%",)
    ).fetchall()

    return [
        {
            "hour": row["hour"],
            "enter_count": row["enter_count"],
            "exit_count": row["exit_count"],
        }
        for row in rows
    ]
