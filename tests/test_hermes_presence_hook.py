import asyncio
import importlib.util
import unittest
from pathlib import Path


def load_hermes_handler():
    path = Path(__file__).resolve().parents[1] / "examples" / "hermes" / "imessage-presence" / "handler.py"
    spec = importlib.util.spec_from_file_location("hermes_imessage_presence_handler", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class HermesPresenceHookTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.mod = load_hermes_handler()

    def test_platform_filter(self):
        self.assertTrue(self.mod._is_imessage_platform("bluebubbles"))
        self.assertTrue(self.mod._is_imessage_platform("imessage"))
        self.assertFalse(self.mod._is_imessage_platform("telegram"))

    def test_resolve_target_prefers_user_id(self):
        target = self.mod._resolve_target({"user_id": "+15551212", "chat_id": "guid"})
        self.assertEqual(target, "+15551212")

    def test_handle_ignores_non_imessage(self):
        asyncio.run(self.mod.handle("agent:start", {"platform": "discord", "user_id": "+1"}))


if __name__ == "__main__":
    unittest.main()
