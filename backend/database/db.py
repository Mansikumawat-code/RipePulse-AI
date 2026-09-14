import sqlite3
import json
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger("ripepulse.database")

DB_PATH = Path(__file__).resolve().parent / "ripepulse.db"

def get_db_connection():
    """Returns a SQLite connection with dict-like Row access and WAL mode for concurrency."""
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")   # Enables concurrent readers + 1 writer
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA synchronous = NORMAL;")  # Faster writes, still safe with WAL
    return conn

def init_db():
    """Creates tables if they do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Batches Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS batches (
        id TEXT PRIMARY KEY,
        produce TEXT NOT NULL,
        variety TEXT,
        icon TEXT DEFAULT '📦',
        harvest_date TEXT,
        arrival_date TEXT,
        zone TEXT,
        pallet_count INTEGER,
        weight_kg REAL,
        estimated_value REAL,
        current_temp REAL,
        baseline_temp REAL,
        current_humidity REAL,
        current_voc REAL,
        baseline_voc REAL,
        sli REAL,
        remaining_shelf_life_hours REAL,
        initial_shelf_life_hours REAL,
        risk_level TEXT,
        confidence_score REAL,
        decay_rate_factor REAL,
        is_rerouted INTEGER DEFAULT 0,
        reroute_required INTEGER DEFAULT 0,
        route_issue INTEGER DEFAULT 0,
        reroute_status TEXT DEFAULT 'pending',
        current_route TEXT, -- JSON
        recommended_action TEXT -- JSON
    );
    """)

    batch_columns = {
        "is_rerouted": "INTEGER DEFAULT 0",
        "reroute_required": "INTEGER DEFAULT 0",
        "route_issue": "INTEGER DEFAULT 0",
        "reroute_status": "TEXT DEFAULT 'pending'",
    }
    existing_batch_columns = {row["name"] for row in cursor.execute("PRAGMA table_info(batches)").fetchall()}
    for column, definition in batch_columns.items():
        if column not in existing_batch_columns:
            cursor.execute(f"ALTER TABLE batches ADD COLUMN {column} {definition}")

    # 2. Telemetry Readings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        time_label TEXT NOT NULL,
        temperature REAL NOT NULL,
        optimal_temp REAL,
        max_threshold REAL,
        humidity REAL NOT NULL,
        optimal_humidity REAL,
        voc REAL NOT NULL,
        voc_threshold REAL,
        sli REAL,
        decay_acceleration REAL,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
    );
    """)

    # 3. Destinations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS destinations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT DEFAULT '🏭',
        category TEXT NOT NULL,
        location TEXT NOT NULL,
        distance_km REAL NOT NULL,
        travel_time_minutes INTEGER NOT NULL,
        coordinates TEXT NOT NULL, -- JSON [lat, lng]
        capacity_available_kg REAL NOT NULL,
        preferred_produce TEXT NOT NULL, -- JSON list
        pricing_factor REAL NOT NULL,
        contact_person TEXT,
        phone TEXT,
        rating REAL,
        recommended_for_batches TEXT -- JSON list
    );
    """)

    # 4. Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        batch_id TEXT,
        produce TEXT,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        status TEXT NOT NULL,
        action_required TEXT
    );
    """)

    # 5. Dispatches Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS dispatches (
        id TEXT PRIMARY KEY,
        batch_id TEXT NOT NULL,
        produce TEXT NOT NULL,
        source TEXT DEFAULT 'Indore Central Cold-Storage Hub',
        destination TEXT NOT NULL,
        destination_id TEXT,
        quantity_kg REAL,
        vehicle_id TEXT,
        status TEXT NOT NULL,
        carrier TEXT,
        driver_name TEXT,
        driver_phone TEXT,
        departure_time TEXT,
        eta TEXT,
        progress_pct INTEGER DEFAULT 0,
        current_coordinates TEXT, -- JSON [lat, lng]
        temperature_maintained TEXT,
        waste_avoided_kg REAL,
        recovered_value TEXT,
        created_at TEXT,
        dispatched_at TEXT,
        arrived_at TEXT,
        route_details TEXT,
        notes TEXT,
        is_rerouted INTEGER DEFAULT 0,
        reroute_required INTEGER DEFAULT 0,
        route_issue INTEGER DEFAULT 0,
        reroute_status TEXT DEFAULT 'pending',
        issue_reason TEXT
    );
    """)

    dispatch_columns = {
        "source": "TEXT DEFAULT 'Indore Central Cold-Storage Hub'",
        "destination_id": "TEXT",
        "quantity_kg": "REAL",
        "vehicle_id": "TEXT",
        "created_at": "TEXT",
        "dispatched_at": "TEXT",
        "arrived_at": "TEXT",
        "route_details": "TEXT",
        "notes": "TEXT",
        "is_rerouted": "INTEGER DEFAULT 0",
        "reroute_required": "INTEGER DEFAULT 0",
        "route_issue": "INTEGER DEFAULT 0",
        "reroute_status": "TEXT DEFAULT 'pending'",
        "issue_reason": "TEXT",
    }
    existing_columns = {row["name"] for row in cursor.execute("PRAGMA table_info(dispatches)").fetchall()}
    for column, definition in dispatch_columns.items():
        if column not in existing_columns:
            cursor.execute(f"ALTER TABLE dispatches ADD COLUMN {column} {definition}")

    # Older reroute records were represented by an approved batch action plus a dispatch.
    cursor.execute("""
        UPDATE batches
        SET is_rerouted = 1, reroute_required = 0, route_issue = 0, reroute_status = 'completed'
        WHERE UPPER(COALESCE(reroute_status, 'pending')) IN ('PENDING', '')
          AND recommended_action LIKE '%APPROVED%'
          AND EXISTS (SELECT 1 FROM dispatches d WHERE d.batch_id = batches.id)
    """)
    cursor.execute("""
        UPDATE batches
        SET reroute_required = 1, route_issue = 1
        WHERE COALESCE(is_rerouted, 0) = 0
          AND UPPER(COALESCE(reroute_status, 'pending')) = 'PENDING'
          AND (UPPER(COALESCE(risk_level, '')) IN ('CRITICAL', 'HIGH')
               OR current_route LIKE '%"isFeasible": false%')
    """)

    # 6. Destination Receipts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS destination_receipts (
        id TEXT PRIMARY KEY,
        dispatch_id TEXT NOT NULL UNIQUE,
        batch_id TEXT NOT NULL,
        sent_weight_kg REAL NOT NULL,
        received_weight_kg REAL NOT NULL,
        damaged_weight_kg REAL NOT NULL,
        missing_weight_kg REAL NOT NULL,
        product_condition TEXT NOT NULL,
        verification_notes TEXT,
        verified_by TEXT NOT NULL,
        facility_name TEXT,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (dispatch_id) REFERENCES dispatches(id) ON DELETE CASCADE
    );
    """)

    # 7. Audit Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        actor_name TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        description TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT,
        details TEXT,
        facility TEXT,
        timestamp TEXT NOT NULL
    );
    """)

    # 8. Inquiries Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        organization TEXT,
        message TEXT,
        warehouse_name TEXT,
        volume_details TEXT,
        status TEXT NOT NULL DEFAULT 'NEW',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 9. Destination Inventory Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS destination_inventory (
        id TEXT PRIMARY KEY,
        facility_name TEXT NOT NULL,
        produce TEXT NOT NULL,
        variety TEXT,
        batch_id TEXT NOT NULL,
        dispatch_id TEXT NOT NULL,
        received_weight_kg REAL NOT NULL,
        product_condition TEXT NOT NULL,
        received_at TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    logger.info("SQLite database schema initialized.")
