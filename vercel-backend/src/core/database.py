import json
import os
import sqlite3
from datetime import datetime

from sqlalchemy import create_engine, text
import sqlalchemy.exc

from src.core.config import settings
from src.core.models import (
    PerformanceReport,
    ResolutionQuality,
    SessionState,
)


class Database:
    """Persistent storage with automatic Postgres (DATABASE_URL) or SQLite fallback."""

    def __init__(self):
        self.db_path = os.path.join(settings.runtime_data_dir, "coach.db")
        self.engine = None
        if settings.database_url:
            self.engine = create_engine(
                settings.database_url,
                pool_pre_ping=True,
                pool_recycle=280,
                pool_size=3,
                max_overflow=2,
                connect_args={"sslmode": "require", "connect_timeout": 15},
            )
        self._init_db()

    @property
    def is_postgres(self) -> bool:
        return self.engine is not None

    def _init_db(self):
        if self.is_postgres:
            with self.engine.begin() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS sessions (
                        session_id TEXT PRIMARY KEY,
                        config TEXT,
                        messages TEXT,
                        created_at TEXT,
                        is_active INTEGER
                    )
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS reports (
                        session_id TEXT PRIMARY KEY,
                        agent_name TEXT,
                        mode TEXT,
                        total_turns INTEGER,
                        overall_score REAL,
                        resolution_score REAL,
                        report_data TEXT,
                        generated_at TEXT
                    )
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS knowledge_chunks (
                        id SERIAL PRIMARY KEY,
                        source_file TEXT,
                        chunk_text TEXT,
                        metadata TEXT,
                        created_at TEXT
                    )
                """))
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS agent_calibration (
                        id SERIAL PRIMARY KEY,
                        agent_name TEXT UNIQUE,
                        calibration_data TEXT,
                        updated_at TEXT
                    )
                """))
            return

        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                session_id TEXT PRIMARY KEY,
                config TEXT,
                messages TEXT,
                created_at TEXT,
                is_active INTEGER
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                session_id TEXT PRIMARY KEY,
                agent_name TEXT,
                mode TEXT,
                total_turns INTEGER,
                overall_score REAL,
                resolution_score REAL,
                report_data TEXT,
                generated_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_file TEXT,
                chunk_text TEXT,
                metadata TEXT,
                created_at TEXT
            )
        """)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS agent_calibration (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_name TEXT UNIQUE,
                calibration_data TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()
        conn.close()

    def _sql(self, query: str) -> str:
        if self.is_postgres:
            return query.replace("?", "%s")
        return query

    def _upsert(self, table: str, cols: list[str], values: tuple):
        if self.is_postgres:
            placeholders = ", ".join(["?"] * len(cols))
            set_clause = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols[1:])
            query = (
                f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({placeholders}) "
                f"ON CONFLICT ({cols[0]}) DO UPDATE SET {set_clause}"
            )
        else:
            placeholders = ", ".join(["?"] * len(cols))
            query = f"INSERT OR REPLACE INTO {table} VALUES ({placeholders})"
        self._exec(query, values)

    def _exec(self, query: str, params: tuple = ()) -> list[tuple]:
        if self.is_postgres:
            with self.engine.begin() as conn:
                try:
                    if params:
                        return conn.exec_driver_sql(self._sql(query), params).fetchall()
                    return conn.exec_driver_sql(self._sql(query)).fetchall()
                except sqlalchemy.exc.ResourceClosedError:
                    return []
        conn = sqlite3.connect(self.db_path)
        try:
            cur = conn.execute(self._sql(query), params)
            rows = cur.fetchall()
            conn.commit()
            return rows
        finally:
            conn.close()

    def save_session(self, session: SessionState):
        self._upsert(
            "sessions",
            ["session_id", "config", "messages", "created_at", "is_active"],
            (
                session.session_id,
                json.dumps({
                    "mode": session.config.mode.value,
                    "product_context": session.config.product_context,
                    "agent_name": session.config.agent_name,
                }),
                json.dumps([m.model_dump() for m in session.messages], default=str),
                session.created_at.isoformat(),
                1 if session.is_active else 0,
            ),
        )

    def get_all_sessions(self) -> list[dict]:
        rows = self._exec(
            "SELECT session_id, config, created_at, is_active FROM sessions ORDER BY created_at DESC"
        )
        return [
            {
                "id": r[0],
                "config": json.loads(r[1]),
                "created_at": r[2],
                "is_active": bool(r[3]),
            }
            for r in rows
        ]

    def delete_all_sessions(self):
        self._exec("DELETE FROM sessions")
        self._exec("DELETE FROM reports")

    def save_report(self, report: PerformanceReport):
        self._upsert(
            "reports",
            ["session_id", "agent_name", "mode", "total_turns", "overall_score", "resolution_score", "report_data", "generated_at"],
            (
                report.session_id,
                report.agent_name,
                report.interaction_mode.value,
                report.total_turns,
                report.overall_score,
                report.resolution_quality.score if report.resolution_quality else 0.0,
                json.dumps(report.model_dump(), default=str),
                report.generated_at.isoformat(),
            ),
        )

    def get_all_reports(self) -> list[PerformanceReport]:
        rows = self._exec("SELECT report_data FROM reports ORDER BY generated_at DESC")
        reports = []
        for (data,) in rows:
            try:
                d = json.loads(data)
                d["resolution_quality"] = (
                    ResolutionQuality(**d["resolution_quality"])
                    if d.get("resolution_quality")
                    else None
                )
                reports.append(PerformanceReport(**d))
            except Exception:
                pass
        return reports

    def save_chunk(self, source_file: str, chunk_text: str, metadata: dict):
        self._exec(
            "INSERT INTO knowledge_chunks (source_file, chunk_text, metadata, created_at) VALUES (?, ?, ?, ?)",
            (source_file, chunk_text, json.dumps(metadata), datetime.now().isoformat()),
        )

    def save_calibration(self, agent_name: str, data: dict):
        if self.is_postgres:
            self._exec(
                "INSERT INTO agent_calibration (agent_name, calibration_data, updated_at) "
                "VALUES (?, ?, ?) "
                "ON CONFLICT (agent_name) DO UPDATE SET calibration_data = EXCLUDED.calibration_data, "
                "updated_at = EXCLUDED.updated_at",
                (agent_name, json.dumps(data), datetime.now().isoformat()),
            )
        else:
            self._exec(
                "INSERT OR REPLACE INTO agent_calibration (id, agent_name, calibration_data, updated_at) "
                "VALUES ((SELECT id FROM agent_calibration WHERE agent_name = ?), ?, ?, ?)",
                (agent_name, agent_name, json.dumps(data), datetime.now().isoformat()),
            )


database = Database()
