<table align="right" border="0">
  <tr>
    <td width="300px">
      <img alt="logo" width="290px" src="docs/images/demo.gif" />
    </td>
  </tr>
</table>

# iMessages Chatbot Server

**OpenClaw-compatible · Hermes-compatible · SIP-free read receipts**

iMessage has no public API. This project turns a macOS device into a headless iMessage gateway for LLMs and agent runtimes. It uses an asynchronous Python server that drives the native Messages app — including **read receipts** and **typing indicators** — without disabling SIP or injecting private IMCore helpers.

Use it in either mode:

| Mode | Who replies | What this project does |
| --- | --- | --- |
| **Chatbot** (default) | This server (Gemini) | Poll `chat.db`, reply via AppleScript, show typing |
| **Presence sidecar** | [OpenClaw](https://docs.openclaw.ai/) or [Hermes Agent](https://hermes-agent.nousresearch.com/) | `imessage-presence` CLI for mark-read + typing UI |

Drop-in hooks live under [`examples/openclaw`](examples/openclaw) and [`examples/hermes`](examples/hermes).

**Launch film:** a square (1080×1080) Remotion showcase for **iMessages Server** lives in [`showcase/`](showcase) — `cd showcase && npm install && npm run dev` / `npm run render`.

## Key Features

*   **OpenClaw & Hermes ready** — stable JSON CLI (`mark-read`, `typing-session`, `typing-stop`) plus example hooks for both agent runtimes.
*   **SIP-free presence** — focuses the Messages thread so read receipts can fire naturally; no `imsg launch` / Private API required.
*   Manages up to **20 concurrent conversations** using asynchronous API calls and a `semaphore` to control load on the AI backend.
*   Injects a realistic typing latency by automatically chunking multi-paragraph AI responses at `\n\n` delimiters and sending each part sequentially with a **dynamic delay** between `1.0` and `3.0` seconds.
*   Implements an **asynchronous debounce timer** of `0.3s` to batch rapid incoming messages from a single user.
*   Maintains **persistent conversation memory** in a local `SQLite` database.
*   Leverages targeted `AppleScript` automation for typing indicators and conversation focus (read-receipt side effect).

---

## How It Works

The chatbot mode is one asyncio loop: watch `chat.db` → debounce → Gemini → AppleScript send.

For OpenClaw / Hermes, keep `MODE=presence-only` and let the agent runtime own replies. On each inbound turn, call `imessage-presence mark-read` (and optionally `typing-session`) so the sender sees a read receipt and typing dots while the agent thinks.

![Architecture Diagram](docs/images/diagrammessages.png)

## Technical Stack

*   **Runtime**: Python 3.8+ using <code>asyncio</code> for a non-blocking event loop.
*   **AI Backend** (chatbot mode): Google Gemini via the official API.
*   **Agent runtimes** (presence mode): OpenClaw and Hermes Agent via hooks + CLI.
*   **Message I/O**: Reads from <code>chat.db</code>; writes / presence via AppleScript automation.
*   **Concurrency**: Semaphore-limited AI calls; a lock serializes Messages.app UI actions.

## Performance

| Metric | Value |
| :--- | :--- |
| **Optimal Capacity** | 15-20 concurrent users |
| **Internal Latency** | Under 2 seconds (excluding AI processing time) |
| **AI Response Time** | ~1.5s average, 0.8s standard deviation |
| **Message Throughput** | ~10-15 messages per minute, sustained |

---

## Installation Guide

### 1. Clone or Download the Repository

```bash
cd ~/Documents
git clone <repository-url> hack-coms-therapy
cd hack-coms-therapy
```

### 2. Install Python Dependencies

```bash
python3 -m pip install -r requirements.txt
```

For OpenClaw / Hermes presence, also install the CLI entry point:

```bash
python3 -m pip install -e .
# confirms: imessage-presence
```

### 3. Configure Environment Variables

Create a `.env` file in the project directory:

```bash
touch .env
```

**Chatbot mode:**

```env
GEMINI_API_KEY=your_gemini_api_key_here
POLL_INTERVAL=0.5
MESSAGE_HISTORY_LIMIT=20
ENABLE_TYPING_INDICATOR=true
```

**OpenClaw / Hermes presence mode:**

```env
MODE=presence-only
```

`GEMINI_API_KEY` is not required in presence-only mode.

### 4. Grant Full Disk Access to Terminal

1. Open **System Settings** → **Privacy & Security** → **Full Disk Access**
2. Unlock and add your Terminal (or the process that runs the gateway / CLI)
3. Restart that app

### 5. Grant Accessibility + Automation (for typing / mark-read)

1. **Privacy & Security** → **Accessibility** → allow Terminal / gateway host
2. When prompted, allow **Automation** control of Messages.app and System Events
3. Restart the app that will run `imessage-presence`

---

## Usage (Chatbot Mode)

```bash
python3 run.py
```

Press `Ctrl+C` to stop. Send a test iMessage to the Mac's number to verify replies.

---

## OpenClaw & Hermes Presence Sidecar

Compatible with **OpenClaw** and **Hermes Agent** for iMessage **read receipts** and typing UI **without SIP disabled**.

In this mode the agent runtime remains the brain. This project only drives Messages.app:

- focus the thread so Messages can mark it read (read receipt side effect)
- show typing by placing a temporary draft placeholder
- keep typing alive during longer turns
- clear the draft when the turn finishes

This mode does **not** use Gemini and does **not** send automatic replies. Set `MODE=presence-only`.

### Install the CLI

```bash
python3 -m pip install -e .
imessage-presence status --json
```

Or without install:

```bash
python3 -m src.presence_cli status --json
```

### Presence Commands

```bash
imessage-presence status --json
imessage-presence focus --to +14084421270 --json
imessage-presence mark-read --to +14084421270 --json
imessage-presence typing-start --to +14084421270 --json
imessage-presence typing --to +14084421270 --duration 5s --json
imessage-presence typing-session --to +14084421270 --max-duration 120s --refresh 4s --json
imessage-presence typing-stop --to +14084421270 --json
imessage-presence clear --json
```

All commands support `--to`, `--chat-id`, `--chat-guid`, `--chat-identifier`, `--timeout`, `--dry-run`, and `--json`.

Successful JSON:

```json
{
  "ok": true,
  "action": "typing-start",
  "target": "+14084421270",
  "method": "ui-applescript"
}
```

Failures stay stable for agent parsers:

```json
{
  "ok": false,
  "action": "typing-start",
  "method": "ui-applescript",
  "error": "target_required",
  "message": "Provide --to, --chat-id, --chat-guid, or --chat-identifier."
}
```

### Recommended turn flow

```bash
imessage-presence mark-read --to "$TARGET" --json
imessage-presence typing-session --to "$TARGET" --max-duration 120s --refresh 4s --json &
# Agent runtime generates + sends the reply
imessage-presence typing-stop --to "$TARGET" --json
imessage-presence clear --json
```

Presence failures should be logged by the agent but must not fail the turn.

---

### OpenClaw setup (read receipts)

OpenClaw's built-in iMessage read receipts use the `imsg` private API (`sendReadReceipts`) and require SIP disabled. This sidecar is the **SIP-free alternative**.

1. Install the CLI on the Messages Mac (`pip install -e .`).
2. Copy the example hook:

```bash
mkdir -p ~/.openclaw/hooks
cp -R examples/openclaw/imessage-presence ~/.openclaw/hooks/
openclaw hooks enable imessage-presence
openclaw gateway restart
```

3. Keep this repo in presence-only mode:

```env
MODE=presence-only
```

4. Optional env overrides for the hook / CLI:

```bash
export IMESSAGE_PRESENCE_CLI=/usr/local/bin/imessage-presence
export IMESSAGE_PRESENCE_TYPING_MAX=120s
export IMESSAGE_PRESENCE_TYPING_REFRESH=4s
```

5. Verify dry-run before live UI control:

```bash
imessage-presence mark-read --to +14084421270 --json --dry-run
imessage-presence typing --to +14084421270 --duration 1s --json --dry-run
```

If you already run `imsg launch` with private-API read/typing, disable this hook so the two paths do not fight over Messages.app.

Example files: [`examples/openclaw/imessage-presence`](examples/openclaw/imessage-presence).

---

### Hermes Agent setup (read receipts)

Hermes BlueBubbles / Photon paths can send native read receipts when their Private API / managed bridge supports it. Use this sidecar when you want **local Messages.app UI presence without Private API / SIP changes** — for example BlueBubbles without the helper, or any Hermes iMessage path where the Mac still has Messages signed in.

1. Install the CLI on the Messages Mac.
2. Install the gateway hook:

```bash
mkdir -p ~/.hermes/hooks
cp -R examples/hermes/imessage-presence ~/.hermes/hooks/
```

3. Set presence-only mode in this project:

```env
MODE=presence-only
```

4. Restart Hermes:

```bash
hermes gateway restart
# or: hermes gateway run
```

The hook listens for `agent:start` / `agent:end` on iMessage-like platforms (`bluebubbles`, `imessage`, …), calls `mark-read` + `typing-session` on start, and `typing-stop` + `clear` on end.

If BlueBubbles Private API already marks chats read (`platforms.bluebubbles.extra.send_read_receipts: true`), either leave this hook out or set Hermes `send_read_receipts: false` so only one path owns receipts.

Example files: [`examples/hermes/imessage-presence`](examples/hermes/imessage-presence).

---

### Local verification

```bash
imessage-presence status --json
imessage-presence mark-read --to +14084421270 --json --dry-run
imessage-presence typing --to +14084421270 --duration 5s --json --dry-run
imessage-presence clear --json --dry-run
```

Remove `--dry-run` only when you are ready for the command to control Messages.app.

### Permissions and limits

UI mode uses normal Messages.app automation. It does **not** require disabling SIP and does **not** claim private IMCore read-receipt RPCs. `mark-read` focuses the conversation; Messages.app may mark the thread read as a side effect when **Settings → Messages → Send Read Receipts** (or the per-chat equivalent) is enabled.

The Mac must be logged into a GUI session, awake, and allowed to control Messages.app:

- Full Disk Access — needed when resolving `--chat-id` / `--chat-guid` from `chat.db`
- Accessibility — System Events keystrokes
- Automation — Messages.app control
- A dedicated Mac mini is recommended because Messages.app may come to the foreground

### Compatibility matrix

| Runtime | How to wire | Read receipts | Typing |
| --- | --- | --- | --- |
| **OpenClaw** | `examples/openclaw/imessage-presence` hook | Yes (UI focus / SIP-free) | Yes |
| **Hermes Agent** | `examples/hermes/imessage-presence` hook | Yes (UI focus / SIP-free) | Yes |
| Standalone chatbot | `python3 run.py` | Typing only in-loop today | Yes |
| OpenClaw `imsg` private API | Native `sendReadReceipts` | Yes (requires SIP off) | Yes |
| Hermes BlueBubbles Private API | `send_read_receipts` | Yes (requires helper) | Yes |
