# Launch showcase (Remotion)

Animated iMessage-style launch film for the SIP-free presence sidecar — **OpenClaw & Hermes compatible**.

This is a designed demo (not a live Mac recording). It shows the product story:

1. Human sends an iMessage  
2. **Delivered → Read** (via `imessage-presence mark-read`)  
3. Typing indicator  
4. Agent reply  
5. OpenClaw / Hermes / SIP-free callouts  

## Quick start

```bash
cd showcase
npm install
npm run dev          # Remotion Studio preview
npm run render       # out/launch.mp4
```

Optional:

```bash
npm run render:webm  # out/launch.webm
npm run render:gif   # out/launch.gif (heavier)
```

## Layout

```text
showcase/
├── src/
│   ├── LaunchVideo.tsx      # Scene timeline
│   ├── components/          # Phone UI + atmosphere
│   ├── theme.ts             # Colors + fonts
│   └── Root.tsx             # Composition registry
├── package.json
└── remotion.config.ts
```

## Notes

- Requires Node 18+ and `ffmpeg` on PATH for rendering.
- Fonts load via `@remotion/google-fonts` (Outfit + Plus Jakarta Sans).
- Output goes to `showcase/out/` (gitignored).
