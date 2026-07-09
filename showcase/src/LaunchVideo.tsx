import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { Atmosphere, BrandMark, FadeIn } from "./components/Atmosphere";
import { HumanPhone } from "./components/IMessagePhone";
import { colors, fonts } from "./theme";

const TitleCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <FadeIn>
        <BrandMark size={28} />
      </FadeIn>
      <FadeIn delay={8}>
        <div
          style={{
            marginTop: 28,
            fontFamily: fonts.display,
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            color: colors.ink,
            textAlign: "center",
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          iMessage presence
          <br />
          that feels native.
        </div>
      </FadeIn>
      <FadeIn delay={16}>
        <div
          style={{
            marginTop: 22,
            fontFamily: fonts.ui,
            fontSize: 22,
            color: colors.muted,
            textAlign: "center",
            maxWidth: 640,
            lineHeight: 1.45,
          }}
        >
          SIP-free read receipts and typing for OpenClaw & Hermes —
          driven by Messages.app, not private APIs.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const captionOpacity = interpolate(frame, [0, 20, 230, 250], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const beat =
    frame < 70
      ? "1 · Message sent"
      : frame < 95
        ? "2 · Marked Read"
        : frame < 165
          ? "3 · Typing indicator"
          : "4 · Agent replies";

  return (
    <AbsoluteFill
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 72,
        padding: "0 64px",
      }}
    >
      <div style={{ width: 420 }}>
        <FadeIn>
          <div
            style={{
              fontFamily: fonts.ui,
              fontSize: 13,
              fontWeight: 650,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: colors.accentSoft,
              marginBottom: 16,
              opacity: captionOpacity,
            }}
          >
            Live presence
          </div>
        </FadeIn>
        <FadeIn delay={4}>
          <div
            style={{
              fontFamily: fonts.display,
              fontSize: 46,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: colors.ink,
              lineHeight: 1.08,
              marginBottom: 18,
            }}
          >
            Watch the
            <br />
            receipt land.
          </div>
        </FadeIn>
        <FadeIn delay={10}>
          <div
            style={{
              fontFamily: fonts.ui,
              fontSize: 18,
              color: colors.muted,
              lineHeight: 1.5,
              maxWidth: 380,
              marginBottom: 28,
            }}
          >
            `imessage-presence mark-read` focuses the thread. Messages.app
            sends the Read receipt — no SIP, no IMCore injection.
          </div>
        </FadeIn>
        <FadeIn delay={16}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${colors.line}`,
              fontFamily: fonts.ui,
              fontSize: 15,
              color: colors.soft,
              opacity: captionOpacity,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                background: colors.success,
                boxShadow: `0 0 12px ${colors.success}`,
              }}
            />
            {beat}
          </div>
        </FadeIn>
      </div>

      <HumanPhone />
    </AbsoluteFill>
  );
};

const CompatScene: React.FC = () => {
  const cards = [
    {
      title: "OpenClaw",
      body: "Drop-in hook on message:received → mark-read + typing-session.",
    },
    {
      title: "Hermes",
      body: "Gateway hook on agent:start / agent:end for the same presence loop.",
    },
    {
      title: "SIP-free",
      body: "UI automation only. Keep SIP on. No private API helper required.",
    },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <FadeIn>
        <BrandMark size={20} />
      </FadeIn>
      <FadeIn delay={6}>
        <div
          style={{
            marginTop: 20,
            fontFamily: fonts.display,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: colors.ink,
            textAlign: "center",
          }}
        >
          Built for agent runtimes.
        </div>
      </FadeIn>
      <div
        style={{
          marginTop: 40,
          display: "flex",
          gap: 18,
          width: "100%",
          maxWidth: 980,
        }}
      >
        {cards.map((card, i) => (
          <FadeIn key={card.title} delay={12 + i * 8} style={{ flex: 1 }}>
            <div
              style={{
                height: "100%",
                padding: "28px 24px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.035)",
                border: `1px solid ${colors.line}`,
                boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              }}
            >
              <div
                style={{
                  fontFamily: fonts.display,
                  fontSize: 24,
                  fontWeight: 700,
                  color: colors.ink,
                  letterSpacing: "-0.03em",
                  marginBottom: 12,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontFamily: fonts.ui,
                  fontSize: 16,
                  color: colors.muted,
                  lineHeight: 1.5,
                }}
              >
                {card.body}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
      }}
    >
      <FadeIn>
        <BrandMark size={26} />
      </FadeIn>
      <FadeIn delay={8}>
        <div
          style={{
            marginTop: 24,
            fontFamily: fonts.display,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: "-0.045em",
            color: colors.ink,
            textAlign: "center",
            lineHeight: 1.08,
          }}
        >
          Read. Type. Reply.
          <br />
          Without breaking SIP.
        </div>
      </FadeIn>
      <FadeIn delay={16}>
        <div
          style={{
            marginTop: 22,
            fontFamily: fonts.ui,
            fontSize: 18,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          examples/openclaw · examples/hermes · imessage-presence
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

/**
 * ~22s launch film @ 30fps
 * 0–90 title · 90–360 demo · 360–510 compat · 510–660 end
 */
export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgDeep }}>
      <Atmosphere />
      <Sequence from={0} durationInFrames={90}>
        <TitleCard />
      </Sequence>
      <Sequence from={90} durationInFrames={270}>
        <DemoScene />
      </Sequence>
      <Sequence from={360} durationInFrames={150}>
        <CompatScene />
      </Sequence>
      <Sequence from={510} durationInFrames={150}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
