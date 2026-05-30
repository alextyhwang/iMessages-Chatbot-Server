<table align="right" border="0">
  <tr>
    <td width="300px">
      <img alt="logo" width="290px" src="docs/images/demo.gif" />
    </td>
  </tr>
</table>

# iMessages Chatbot Server

iMessage has no public API. This project provides a high-performance solution by turning any macOS device into a headless iMessage gateway for large language models/automated messaging. It uses an asynchronous Python server that programmatically controls the native Messages app, achieving what Apple doesn't natively support: read receipts, typing indicators, and concurrent AI conversations over the iMessage network.

## Key Features

*   Manages up to **20 concurrent conversations** using asynchronous API calls and a `semaphore` to control load on the AI backend.
*   Injects a realistic typing latency by automatically chunking multi-paragraph AI responses at `\n\n` delimiters and sending each part sequentially with a **dynamic delay** between `1.0` and `3.0` seconds.
*   Implements an **asynchronous debounce timer** of `0.3s` to batch rapid incoming messages from a single user, preventing premature API calls and ensuring the AI receives a more complete conversational context.
*   Maintains **persistent conversation memory** by caching each user's message history in a `SQLite` database, ensuring all interactions are stateful and context-aware.
*   Leverages targeted `AppleScript` automation to simulate native iMessage interactivity, triggering the **typing indicator** during AI processing and programmatically marking messages as **Read** upon ingestion from the `chat.db` file.

---

## How It Works

The whole system is one simple loop. Our asyncio Python server constantly watches the local Messages database for new messages. When one comes in, it grabs the content, bundles it with the conversation history, and sends it off to the Gemini API. Once Gemini replies, the server uses AppleScript to type and send the response right back through the Messages app.

![Architecture Diagram](docs/images/diagrammessages.png)

## Technical Stack

*   **Runtime**: Python 3.8+ using <code>asyncio</code> for a non-blocking event loop.
*   **AI Backend**: Google's Gemini Pro model, accessed via its official API.
*   **Message I/O**: Reads directly from the <code>chat.db</code> SQLite file on macOS and writes responses using AppleScript automation.
*   **Concurrency**: Manages simultaneous API calls with a semaphore, while a lock ensures messages are sent one-by-one to the GUI.

## Performance

Here's what you can expect in terms of performance on a standard Mac Mini:

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

### 3. Configure Environment Variables

Create a `.env` file in the project directory:

```bash
touch .env
```

Edit `.env` and add your configuration:

```env
GEMINI_API_KEY=your_gemini_api_key_here
POLL_INTERVAL=0.5
MESSAGE_HISTORY_LIMIT=20
ENABLE_TYPING_INDICATOR=true
```

**Required Variables:**
- `GEMINI_API_KEY`: Your Google Gemini API key

**Optional Variables:**
- `POLL_INTERVAL`: How often to check for new messages in seconds (default: 0.5)
- `MESSAGE_HISTORY_LIMIT`: Number of recent messages to send to AI for context (default: 20)
- `ENABLE_TYPING_INDICATOR`: Show typing indicators (default: true)

### 4. Grant Full Disk Access to Terminal

For the server to read the Messages database, you must grant Full Disk Access:

1. Open **System Preferences** → **Security & Privacy** → **Privacy**
2. Select **Full Disk Access** from the left sidebar
3. Click the lock icon and authenticate
4. Click the **+** button and add your Terminal application
   - For Terminal.app: `/Applications/Utilities/Terminal.app`
   - For iTerm2: `/Applications/iTerm.app`
5. Restart your Terminal application

### 5. Grant Accessibility Permissions (for Typing Indicators)

1. Open **System Preferences** → **Security & Privacy** → **Privacy**
2. Select **Accessibility** from the left sidebar
3. Click **+** and add your Terminal application
4. Check the box next to Terminal
5. Restart your Terminal application

---

## Usage

### Starting the Server

```bash
python3 run.py
```

The server will:
- Initialize the local conversation database
- Connect to the Gemini API
- Begin monitoring for new messages
- Log all activity to both console and `server.log`

### Stopping the Server

Press `Ctrl+C` or send a SIGTERM signal. The server will gracefully:
- Complete all in-flight conversations
- Close database connections
- Clean up resources

### Testing

Send a test message to your iPhone's phone number from another device. You should see:
1. Console log showing message detection
2. AI API request/response logs
3. Message sent confirmation
4. Reply appearing in Messages app

---

## OpenClaw Presence Sidecar

This project can also run as an iMessage presence adapter for OpenClaw. In this mode OpenClaw remains the agent runtime and this project only provides Messages.app UI behavior:

- focus the relevant thread so Messages can mark it read naturally
- show a typing indicator by placing a temporary draft placeholder
- keep typing alive during longer OpenClaw turns
- clear the draft when work finishes

This mode does not use Gemini and does not send automatic replies.

### Install the CLI

```bash
python3 -m pip install -e .
```

This installs:

```bash
imessage-presence
```

You can also run it without installation:

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

All commands support:

```text
--to
--chat-id
--chat-guid
--chat-identifier
--timeout
--dry-run
--json
```

Successful JSON output is stable:

```json
{
  "ok": true,
  "action": "typing-start",
  "target": "+14084421270",
  "method": "ui-applescript"
}
```

Failures are also stable:

```json
{
  "ok": false,
  "action": "typing-start",
  "method": "ui-applescript",
  "error": "target_required",
  "message": "Provide --to, --chat-id, --chat-guid, or --chat-identifier."
}
```

### Presence-Only Mode

Set this when OpenClaw is handling messages, so this project cannot become a duplicate responder:

```env
MODE=presence-only
```

Then use only the CLI from OpenClaw hooks. `run.py` will not start the polling/Gemini reply loop in this mode.

### OpenClaw Config

Use the sidecar from OpenClaw's iMessage channel configuration:

```json
{
  "channels": {
    "imessage": {
      "presence": {
        "enabled": true,
        "mode": "ui",
        "cliPath": "/usr/local/bin/imessage-presence",
        "markReadOnInbound": true,
        "typingOnInbound": true,
        "typingKeepaliveSeconds": 4,
        "typingMaxSeconds": 120,
        "focusMessagesApp": true,
        "clearDraftOnStop": true
      }
    }
  }
}
```

Presence command failures should be logged by OpenClaw but should not fail the agent turn.

Example OpenClaw-style hook flow:

```bash
imessage-presence mark-read --to "$OPENCLAW_IMESSAGE_TARGET" --json
imessage-presence typing-session --to "$OPENCLAW_IMESSAGE_TARGET" --max-duration 120s --refresh 4s --json &
# Run the OpenClaw agent turn and send the final response through OpenClaw's iMessage channel.
imessage-presence typing-stop --to "$OPENCLAW_IMESSAGE_TARGET" --json
imessage-presence clear --json
```

### Local Verification

Before wiring OpenClaw, check the local sidecar:

```bash
imessage-presence status --json
imessage-presence mark-read --to +14084421270 --json --dry-run
imessage-presence typing --to +14084421270 --duration 5s --json --dry-run
imessage-presence clear --json --dry-run
```

Remove `--dry-run` only when you are ready for the command to control Messages.app.

### Permissions And Limits

The UI mode uses normal Messages.app automation. It does not require disabling SIP and it does not claim private IMCore read receipt support. `mark-read` focuses the Messages conversation; Messages.app may mark the thread read as a side effect depending on the local Messages/iMessage settings.

The Mac must be logged into the GUI session, awake, and allowed to control Messages.app:

- Full Disk Access is needed only when resolving `--chat-id` or `--chat-guid` from `~/Library/Messages/chat.db`.
- Accessibility permission is needed for System Events keystrokes.
- Automation permission is needed for controlling Messages.app.
- A dedicated Mac mini is recommended because Messages.app may come to the foreground.
