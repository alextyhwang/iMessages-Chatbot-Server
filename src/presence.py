import asyncio
import contextlib
import fcntl
import json
import os
import re
import shutil
import sqlite3
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Optional

from src.config import Config


LOCK_PATH = Path(os.getenv("IMESSAGE_PRESENCE_LOCK", "/tmp/imessage-presence.lock"))
SESSION_DIR = Path(os.getenv("IMESSAGE_PRESENCE_SESSION_DIR", "/tmp/imessage-presence-sessions"))


class PresenceError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


@dataclass
class PresenceTarget:
    to: Optional[str] = None
    chat_id: Optional[str] = None
    chat_guid: Optional[str] = None
    chat_identifier: Optional[str] = None

    @property
    def requested(self) -> Optional[str]:
        return self.to or self.chat_identifier or self.chat_guid or self.chat_id


@dataclass
class PresenceResult:
    ok: bool
    action: str
    target: Optional[str] = None
    method: str = "ui-applescript"
    duration_ms: Optional[int] = None
    dry_run: bool = False
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    message: Optional[str] = None

    def as_dict(self) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "ok": self.ok,
            "action": self.action,
            "method": self.method,
        }
        if self.target:
            payload["target"] = self.target
        if self.duration_ms is not None:
            payload["durationMs"] = self.duration_ms
        if self.dry_run:
            payload["dryRun"] = True
        if self.data:
            payload.update(self.data)
        if self.error:
            payload["error"] = self.error
        if self.message:
            payload["message"] = self.message
        return payload

    def to_json(self) -> str:
        return json.dumps(self.as_dict(), sort_keys=True)


def escape_applescript_string(text: str) -> str:
    text = text.replace("\\", "\\\\")
    text = text.replace('"', '\\"')
    text = text.replace("\n", "\\n")
    text = text.replace("\r", "\\r")
    return text


def parse_duration_seconds(value: Optional[str], default: float = 5.0) -> float:
    if value is None:
        return default

    raw = str(value).strip().lower()
    match = re.fullmatch(r"(\d+(?:\.\d+)?)(ms|s|m)?", raw)
    if not match:
        raise PresenceError("invalid_duration", f"Invalid duration '{value}'. Use values like 500ms, 5s, or 2m.")

    amount = float(match.group(1))
    unit = match.group(2) or "s"
    if unit == "ms":
        return amount / 1000
    if unit == "m":
        return amount * 60
    return amount


class TargetResolver:
    def __init__(self, chat_db_path: Optional[str] = None):
        self.chat_db_path = os.path.expanduser(chat_db_path or Config.CHAT_DB_PATH)

    def resolve(self, target: PresenceTarget, require_target: bool = True) -> Optional[str]:
        if target.to:
            return target.to
        if target.chat_identifier:
            return target.chat_identifier
        if target.chat_id:
            return self._resolve_from_chat_db("ROWID", target.chat_id)
        if target.chat_guid:
            return self._resolve_from_chat_db("guid", target.chat_guid)
        if require_target:
            raise PresenceError("target_required", "Provide --to, --chat-id, --chat-guid, or --chat-identifier.")
        return None

    def _resolve_from_chat_db(self, column: str, value: str) -> str:
        if column not in {"ROWID", "guid"}:
            raise PresenceError("invalid_target_selector", f"Unsupported chat selector '{column}'.")

        if not os.path.exists(self.chat_db_path):
            raise PresenceError("chat_db_missing", f"Messages database not found at {self.chat_db_path}.")

        try:
            with sqlite3.connect(f"file:{self.chat_db_path}?mode=ro", uri=True, timeout=2) as db:
                cursor = db.execute(f"SELECT chat_identifier FROM chat WHERE {column} = ? LIMIT 1", (value,))
                row = cursor.fetchone()
        except sqlite3.OperationalError as exc:
            raise PresenceError("full_disk_access_missing", f"Could not read Messages database: {exc}") from exc

        if not row or not row[0]:
            raise PresenceError("target_not_found", f"No Messages chat matched {column}={value}.")
        return row[0]


class PresenceController:
    def __init__(
        self,
        chat_db_path: Optional[str] = None,
        dry_run: bool = False,
        timeout: float = 8.0,
        lock_timeout: float = 10.0,
    ):
        self.resolver = TargetResolver(chat_db_path)
        self.dry_run = dry_run
        self.timeout = timeout
        self.lock_timeout = lock_timeout

    async def status(self) -> PresenceResult:
        status = {
            "mode": "ui",
            "sip": self._sip_status(),
            "fullDiskAccess": self._has_full_disk_access(),
            "accessibility": self._has_accessibility_access(),
            "automationMessages": self._has_messages_automation_access(),
            "messagesRunning": self._messages_running(),
            "macLocked": self._mac_locked(),
            "advancedImcoreAvailable": self._advanced_imcore_available(),
            "osascriptAvailable": shutil.which("osascript") is not None,
        }
        status["uiPresenceAvailable"] = bool(
            status["osascriptAvailable"] and status["accessibility"] and status["automationMessages"] and not status["macLocked"]
        )
        return PresenceResult(ok=True, action="status", method="status-check", data=status)

    async def focus(self, target: PresenceTarget, action: str = "focus") -> PresenceResult:
        resolved = self.resolver.resolve(target)
        script = self._focus_script(resolved)
        await self._run_locked_script(script)
        return PresenceResult(ok=True, action=action, target=resolved, dry_run=self.dry_run)

    async def mark_read(self, target: PresenceTarget) -> PresenceResult:
        return await self.focus(target, action="mark-read")

    async def typing_start(self, target: PresenceTarget) -> PresenceResult:
        resolved = self.resolver.resolve(target)
        script = self._typing_start_script(resolved)
        await self._run_locked_script(script)
        return PresenceResult(ok=True, action="typing-start", target=resolved, dry_run=self.dry_run)

    async def typing(self, target: PresenceTarget, duration_seconds: float) -> PresenceResult:
        resolved = self.resolver.resolve(target)
        started = False
        try:
            await self.typing_start(PresenceTarget(to=resolved))
            started = True
            if not self.dry_run:
                await asyncio.sleep(duration_seconds)
        except Exception:
            with contextlib.suppress(Exception):
                await self.clear()
            raise
        finally:
            if started:
                await self.clear()
        return PresenceResult(
            ok=True,
            action="typing",
            target=resolved,
            duration_ms=int(duration_seconds * 1000),
            dry_run=self.dry_run,
        )

    async def typing_session(
        self,
        target: PresenceTarget,
        max_duration_seconds: float,
        refresh_seconds: float,
    ) -> PresenceResult:
        resolved = self.resolver.resolve(target)
        if self.dry_run:
            return PresenceResult(
                ok=True,
                action="typing-session",
                target=resolved,
                duration_ms=int(max_duration_seconds * 1000),
                dry_run=True,
                data={"refreshMs": int(refresh_seconds * 1000)},
            )

        session_path = self._session_path(resolved)
        SESSION_DIR.mkdir(parents=True, exist_ok=True)
        session_payload = {
            "pid": os.getpid(),
            "target": resolved,
            "startedAt": time.time(),
            "expiresAt": time.time() + max_duration_seconds,
            "refreshSeconds": refresh_seconds,
        }
        session_path.write_text(json.dumps(session_payload, sort_keys=True), encoding="utf-8")

        started = time.monotonic()
        try:
            while session_path.exists() and time.monotonic() - started < max_duration_seconds:
                await self.typing_start(PresenceTarget(to=resolved))
                remaining = max_duration_seconds - (time.monotonic() - started)
                if remaining <= 0:
                    break
                await asyncio.sleep(min(refresh_seconds, remaining))
        finally:
            try:
                await self.clear()
            finally:
                with contextlib.suppress(FileNotFoundError):
                    session_path.unlink()

        return PresenceResult(
            ok=True,
            action="typing-session",
            target=resolved,
            duration_ms=int(max_duration_seconds * 1000),
            dry_run=self.dry_run,
            data={"refreshMs": int(refresh_seconds * 1000)},
        )

    async def clear(self) -> PresenceResult:
        await self._run_locked_script(self._clear_script())
        return PresenceResult(ok=True, action="clear", dry_run=self.dry_run)

    async def typing_stop(self, target: Optional[PresenceTarget] = None) -> PresenceResult:
        resolved = None
        if target and target.requested:
            resolved = self.resolver.resolve(target)
            with contextlib.suppress(FileNotFoundError):
                self._session_path(resolved).unlink()
        await self.clear()
        return PresenceResult(ok=True, action="typing-stop", target=resolved, dry_run=self.dry_run)

    async def _run_locked_script(self, script: str) -> None:
        with self._lock():
            await self._run_script(script)

    @contextlib.contextmanager
    def _lock(self):
        LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
        with LOCK_PATH.open("w", encoding="utf-8") as lock_file:
            deadline = time.monotonic() + self.lock_timeout
            while True:
                try:
                    fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    break
                except BlockingIOError as exc:
                    if time.monotonic() >= deadline:
                        raise PresenceError("presence_lock_timeout", "Timed out waiting for Messages UI automation lock.") from exc
                    time.sleep(0.05)
            try:
                yield
            finally:
                fcntl.flock(lock_file, fcntl.LOCK_UN)

    async def _run_script(self, script: str) -> None:
        if self.dry_run:
            return
        if shutil.which("osascript") is None:
            raise PresenceError("osascript_missing", "osascript is not available on this system.")

        process = await asyncio.create_subprocess_exec(
            "osascript",
            "-e",
            script,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=self.timeout)
        except asyncio.TimeoutError as exc:
            process.kill()
            await process.communicate()
            raise PresenceError("applescript_timeout", f"AppleScript action exceeded {self.timeout:.1f}s timeout.") from exc

        if process.returncode != 0:
            error_text = stderr.decode().strip() or stdout.decode().strip() or "AppleScript failed."
            raise PresenceError(self._classify_applescript_error(error_text), error_text)

    @staticmethod
    def _classify_applescript_error(error_text: str) -> str:
        lowered = error_text.lower()
        if "-1743" in lowered or "not authorized" in lowered or "not allowed" in lowered:
            return "automation_permission_missing"
        if "assistive access" in lowered or "accessibility" in lowered:
            return "accessibility_permission_missing"
        if "messages got an error" in lowered:
            return "messages_unavailable"
        return "ui_automation_failed"

    @staticmethod
    def _focus_script(target: str) -> str:
        escaped = escape_applescript_string(target)
        return f'''
        tell application "Messages"
            activate
        end tell
        delay 0.25
        tell application "System Events"
            tell process "Messages"
                set frontmost to true
                delay 0.2
                keystroke "n" using command down
                delay 0.3
                keystroke "{escaped}"
                delay 0.3
                key code 48
                delay 0.15
            end tell
        end tell
        '''

    @staticmethod
    def _typing_start_script(target: str) -> str:
        escaped = escape_applescript_string(target)
        return f'''
        tell application "Messages"
            activate
        end tell
        delay 0.25
        tell application "System Events"
            tell process "Messages"
                set frontmost to true
                delay 0.2
                keystroke "n" using command down
                delay 0.3
                keystroke "{escaped}"
                delay 0.3
                key code 48
                delay 0.15
                keystroke "."
            end tell
        end tell
        '''

    @staticmethod
    def _clear_script() -> str:
        return '''
        tell application "Messages"
            activate
        end tell
        delay 0.1
        tell application "System Events"
            tell process "Messages"
                set frontmost to true
                delay 0.05
                keystroke "a" using command down
                delay 0.05
                key code 51
                delay 0.05
                key code 53
                delay 0.05
                key code 53
            end tell
        end tell
        '''

    @staticmethod
    def _session_path(target: str) -> Path:
        safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", target).strip("_") or "default"
        return SESSION_DIR / f"{safe}.json"

    @staticmethod
    def _run_probe(command: list, timeout: float = 2.0) -> subprocess.CompletedProcess:
        return subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)

    def _has_full_disk_access(self) -> bool:
        db_path = os.path.expanduser(Config.CHAT_DB_PATH)
        if not os.path.exists(db_path):
            return False
        try:
            with sqlite3.connect(f"file:{db_path}?mode=ro", uri=True, timeout=2) as db:
                db.execute("SELECT ROWID FROM chat LIMIT 1").fetchone()
            return True
        except sqlite3.Error:
            return False

    def _has_accessibility_access(self) -> bool:
        if shutil.which("osascript") is None:
            return False
        try:
            result = self._run_probe(["osascript", "-e", 'tell application "System Events" to get UI elements enabled'])
            return result.returncode == 0 and result.stdout.strip().lower() == "true"
        except (subprocess.SubprocessError, OSError):
            return False

    def _has_messages_automation_access(self) -> bool:
        if shutil.which("osascript") is None:
            return False
        try:
            result = self._run_probe(["osascript", "-e", 'tell application "Messages" to get name'])
            return result.returncode == 0
        except (subprocess.SubprocessError, OSError):
            return False

    @staticmethod
    def _messages_running() -> bool:
        try:
            return subprocess.run(["pgrep", "-x", "Messages"], capture_output=True, check=False).returncode == 0
        except OSError:
            return False

    @staticmethod
    def _mac_locked() -> bool:
        try:
            result = subprocess.run(["ioreg", "-n", "Root", "-d1"], capture_output=True, text=True, timeout=2, check=False)
        except (subprocess.SubprocessError, OSError):
            return False
        return "CGSSessionScreenIsLocked" in result.stdout and "Yes" in result.stdout

    @staticmethod
    def _sip_status() -> str:
        if shutil.which("csrutil") is None:
            return "unknown"
        try:
            result = subprocess.run(["csrutil", "status"], capture_output=True, text=True, timeout=2, check=False)
        except (subprocess.SubprocessError, OSError):
            return "unknown"
        lowered = result.stdout.lower()
        if "enabled" in lowered:
            return "enabled"
        if "disabled" in lowered:
            return "disabled"
        return "unknown"

    @staticmethod
    def _advanced_imcore_available() -> bool:
        return shutil.which("imsg") is not None
