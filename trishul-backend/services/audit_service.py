import json
import threading
from pathlib import Path
from datetime import datetime, timezone


AUDIT_LOG_PATH = Path(__file__).parent.parent / "data" / "audit_log.json"

_lock = threading.Lock()


def _load_log() -> list[dict]:
    """Load the audit log from disk, returning an empty list if the file
    doesn't exist yet."""
    if not AUDIT_LOG_PATH.exists():
        return []
    with open(AUDIT_LOG_PATH, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return []


def _save_log(entries: list[dict]) -> None:
    """Persist the full audit log to disk."""
    with open(AUDIT_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def log_event(
    event_type: str,
    project_id: str,
    description: str,
    actor: str = "System",
) -> dict:
    """
    Append an event to the persistent audit log.

    event_type: PROJECT_ANALYZED | AI_INVESTIGATION | SCHEDULE_INSPECTION
                | VERIFY_EXPENDITURE | REVIEW_CONTRACTOR
    """
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "project_id": project_id,
        "description": description,
        "actor": actor,
    }
    with _lock:
        entries = _load_log()
        entries.append(entry)
        _save_log(entries)
    return entry


def get_all_events() -> list[dict]:
    """Return all audit events, most recent first."""
    with _lock:
        entries = _load_log()
    return list(reversed(entries))
