import asyncio
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from src.presence import (
    PresenceController,
    PresenceTarget,
    TargetResolver,
    escape_applescript_string,
    parse_duration_seconds,
)


class PresenceHelpersTest(unittest.TestCase):
    def test_escape_applescript_string(self):
        self.assertEqual(
            escape_applescript_string('say "hi"\\there\nnow\r'),
            'say \\"hi\\"\\\\there\\nnow\\r',
        )

    def test_parse_duration_seconds(self):
        self.assertEqual(parse_duration_seconds("500ms"), 0.5)
        self.assertEqual(parse_duration_seconds("5s"), 5)
        self.assertEqual(parse_duration_seconds("2m"), 120)
        self.assertEqual(parse_duration_seconds("3"), 3)

    def test_target_resolver_supports_chat_id_and_guid(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            db_path = Path(temp_dir) / "chat.db"
            with sqlite3.connect(db_path) as db:
                db.execute("CREATE TABLE chat (ROWID INTEGER PRIMARY KEY, guid TEXT, chat_identifier TEXT)")
                db.execute(
                    "INSERT INTO chat (ROWID, guid, chat_identifier) VALUES (42, 'iMessage;+;chat-guid', '+14085551212')"
                )

            resolver = TargetResolver(str(db_path))
            self.assertEqual(resolver.resolve(PresenceTarget(chat_id="42")), "+14085551212")
            self.assertEqual(resolver.resolve(PresenceTarget(chat_guid="iMessage;+;chat-guid")), "+14085551212")


class PresenceCliTest(unittest.TestCase):
    def run_cli(self, *args):
        env = os.environ.copy()
        env["PYTHONPATH"] = str(Path(__file__).resolve().parents[1])
        return subprocess.run(
            [sys.executable, "-m", "src.presence_cli", *args],
            cwd=Path(__file__).resolve().parents[1],
            capture_output=True,
            text=True,
            env=env,
            check=False,
        )

    def test_typing_dry_run_json(self):
        result = self.run_cli("typing", "--to", "+14085551212", "--duration", "1ms", "--json", "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["action"], "typing")
        self.assertEqual(payload["target"], "+14085551212")
        self.assertEqual(payload["durationMs"], 1)
        self.assertTrue(payload["dryRun"])

    def test_missing_target_returns_stable_json_error(self):
        result = self.run_cli("typing-start", "--json", "--dry-run")
        self.assertEqual(result.returncode, 1)
        payload = json.loads(result.stdout)
        self.assertFalse(payload["ok"])
        self.assertEqual(payload["action"], "typing-start")
        self.assertEqual(payload["error"], "target_required")

    def test_typing_stop_clears_in_dry_run(self):
        result = self.run_cli("typing-stop", "--to", "+14085551212", "--json", "--dry-run")
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["action"], "typing-stop")
        self.assertEqual(payload["target"], "+14085551212")

    def test_typing_session_dry_run_json(self):
        result = self.run_cli(
            "typing-session",
            "--to",
            "+14085551212",
            "--max-duration",
            "120s",
            "--refresh",
            "4s",
            "--json",
            "--dry-run",
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        payload = json.loads(result.stdout)
        self.assertTrue(payload["ok"])
        self.assertEqual(payload["action"], "typing-session")
        self.assertEqual(payload["durationMs"], 120000)
        self.assertEqual(payload["refreshMs"], 4000)


class PresenceControllerTest(unittest.TestCase):
    def test_typing_stop_is_safe_after_start_failure_in_dry_run(self):
        controller = PresenceController(dry_run=True)
        result = asyncio.run(controller.typing_stop())
        self.assertTrue(result.ok)
        self.assertEqual(result.action, "typing-stop")


if __name__ == "__main__":
    unittest.main()
