# Launch showcase (Remotion)

Square (1080×1080) iMessage-style launch film for **iMessages Server** — OpenClaw & Hermes compatible.

Designed demo (not a live Mac recording):

1. Brand title  
2. Phone: Sent → Delivered → **Read** → typing → reply (zoomed in)  
3. End card  

Includes background music + UI sound effects under `public/audio/`.

## Quick start

```bash
cd showcase
npm install
npm run dev          # Remotion Studio
npm run render       # out/launch.mp4 (square)
```

## Notes

- 1080×1080 for easy Twitter/X posting
- Branding: **iMessages Server** (not “Presence”)
- Requires Node 18+ and `ffmpeg` on PATH
