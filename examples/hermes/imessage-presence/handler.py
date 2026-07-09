"""Hermes gateway hook: drive Messages.app read/typing via imessage-presence.

Compatible with Hermes Agent when you want SIP-free UI presence on a Mac that
owns Messages.app (for example alongside BlueBubbles without Private API, or
any local iMessage relay that still leaves Messages.app available).

Install:
  1. python3 -m pip install -e /path/to/hack-coms-therapy
  2. cp -R examples/hermes/imessage-presence ~/.hermes/hooks/
  3. Set MODE=presence-only in this project's .env
  4. Restart: hermes gateway restart
"""

from __future__ import annotations

import os
import shutil
import subprocess
from typing import Any, Dict, Optional, Set

CLI = os.getenv("IMESSAGE_PRESENCE_CLI", "imessage-presence")
MAX_TYPING = os.getenv("IMESSAGE_PRESENCE_TYPING_MAX", "120s")
TYPING_REFRESH = os.getenv("IMESSAGE_PRESENCE_TYPING_REFRESH", "4s")

# Platforms where a local Messages.app focus can still produce a read receipt.
IMESSAGE_PLATFORMS: Set[str] = {
    "bluebubbles",
    "imessage",
    "imsg",
    "messages",
}


def _cli_path() -> Optional[str]:
    if os.path.isabs(CLI) and os.access(CLI, os.X_OK):
        return CLI
    return shutil.which(CLI)


def _is_imessage_platform(platform: str) -> bool:
    name = (platform or "").strip().lower()
    if not name:
        return False
    if name in IMESSAGE_PLATFORMS:
        return True
    return "imessage" in name or "bluebubble" in name


def _resolve_target(context: Dict[str, Any]) -> Optional[str]:
    for key in (
        "user_id",
        "chat_id",
        "chat_identifier",
        "sender_id",
        "from",
        "handle",
    ):
        value = context.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _run(args: list[str]) -> None:
    binary = _cli_path()
    if not binary:
        print(f"[imessage-presence] CLI not found: {CLI}", flush=True)
        return
    try:
        completed = subprocess.run(
            [binary, *args],
            capture_output=True,
            text=True,
            timeout=20,
            check=False,
        )
        if completed.stdout.strip():
            print(f"[imessage-presence] {completed.stdout.strip()}", flush=True)
        if completed.returncode != 0 and completed.stderr.strip():
            print(f"[imessage-presence] stderr: {completed.stderr.strip()}", flush=True)
    except Exception as exc:  # noqa: BLE001 - hooks must never crash the gateway
        print(f"[imessage-presence] failed ({' '.join(args)}): {exc}", flush=True)


def _start_typing_session(target: str) -> None:
    binary = _cli_path()
    if not binary:
        return
    try:
        subprocess.Popen(
            [
                binary,
                "typing-session",
                "--to",
                target,
                "--max-duration",
                MAX_TYPING,
                "--refresh",
                TYPING_REFRESH,
                "--json",
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"[imessage-presence] typing-session spawn failed: {exc}", flush=True)


async def handle(event_type: str, context: dict):
    """Called by Hermes for each subscribed gateway event."""
    platform = str(context.get("platform") or "")
    if not _is_imessage_platform(platform):
        return

    target = _resolve_target(context)
    if not target:
        print("[imessage-presence] skipped: no target in hook context", flush=True)
        return

    if event_type == "agent:start":
        _run(["mark-read", "--to", target, "--json"])
        _start_typing_session(target)
        return

    if event_type == "agent:end":
        _run(["typing-stop", "--to", target, "--json"])
        _run(["clear", "--json"])
