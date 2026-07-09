# Agent integration examples

Drop-in hooks that call `imessage-presence` for **SIP-free iMessage read receipts and typing**.

| Runtime | Path | Install target |
| --- | --- | --- |
| OpenClaw | [`openclaw/imessage-presence`](openclaw/imessage-presence) | `~/.openclaw/hooks/` |
| Hermes Agent | [`hermes/imessage-presence`](hermes/imessage-presence) | `~/.hermes/hooks/` |

Prerequisites on the Messages Mac:

```bash
python3 -m pip install -e /path/to/hack-coms-therapy
echo 'MODE=presence-only' >> /path/to/hack-coms-therapy/.env
imessage-presence status --json
```

Full setup: [README.md](../README.md#openclaw--hermes-presence-sidecar).
