---
name: imessage-presence
description: "SIP-free iMessage read receipts + typing via imessage-presence (OpenClaw compatible)"
metadata:
  {
    "openclaw":
      {
        "emoji": "💬",
        "events": ["message:received", "message:sent"],
        "os": ["darwin"],
        "requires": { "bins": ["imessage-presence"] },
        "homepage": "https://github.com/alextyhwang/hack-coms-therapy"
      }
  }
---

# iMessage Presence (OpenClaw)

Calls the `imessage-presence` CLI on inbound/outbound iMessage events so OpenClaw
can show **read receipts** and **typing indicators** without disabling SIP or
injecting the `imsg` private-API helper.

## Install

1. On the Mac signed into Messages, install this repo:

```bash
cd /path/to/hack-coms-therapy
python3 -m pip install -e .
which imessage-presence
```

2. Copy this hook into OpenClaw managed hooks:

```bash
mkdir -p ~/.openclaw/hooks
cp -R examples/openclaw/imessage-presence ~/.openclaw/hooks/
```

3. Enable it and restart the gateway:

```bash
openclaw hooks enable imessage-presence
openclaw gateway restart
```

4. Keep this project in presence-only mode so it does not also auto-reply:

```env
MODE=presence-only
```

## Behavior

| Event | Action |
| --- | --- |
| `message:received` (iMessage) | `mark-read` then background `typing-session` |
| `message:sent` (iMessage) | `typing-stop` + `clear` |

Failures are logged and never fail the agent turn.

## Notes

- `mark-read` focuses the Messages thread. Messages.app may emit a read receipt
  as a side effect when Send Read Receipts is enabled for that chat.
- Prefer a dedicated Mac mini: Messages.app may come to the foreground.
- If you already use `imsg` private API with `channels.imessage.sendReadReceipts`,
  disable this hook to avoid double presence automation.
