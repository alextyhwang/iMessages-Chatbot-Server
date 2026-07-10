import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Atmosphere, BrandMark, FadeIn } from "./components/Atmosphere";
import { HumanPhone, PHONE_BEATS } from "./components/IMessagePhone";
import { colors, fonts } from "./theme";

const DEMO_FROM = 70;
const DEMO_LEN = 280;
const END_FROM = 350;
const END_LEN = 130;
export const LAUNCH_DURATION = END_FROM + END_LEN; // 480 @ 30fps = 16s

const TitleCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 56,
      }}
    >
      <FadeIn>
        <BrandMark size={34} />
      </FadeIn>
      <FadeIn delay={10}>
        <div
          style={{
            marginTop: 32,
            fontFamily: fonts.display,
            fontSize: 76,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            color: colors.ink,
            textAlign: "center",
            lineHeight: 1.05,
            maxWidth: 920,
          }}
        >
          Read receipts.
          <br />
          Typing. Replies.
        </div>
      </FadeIn>
      <FadeIn delay={18}>
        <div
          style={{
            marginTop: 24,
            fontFamily: fonts.ui,
            fontSize: 26,
            color: colors.muted,
            textAlign: "center",
            maxWidth: 640,
            lineHeight: 1.35,
          }}
        >
          For OpenClaw & Hermes — no SIP required.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { readAt, typingAt, replyAt } = PHONE_BEATS;

  const beat =
    frame < readAt
      ? "Sent"
      : frame < typingAt
        ? "Read"
        : frame < replyAt
          ? "Typing…"
          : "Reply";

  const captionOpacity = interpolate(frame, [0, 12, 250, 275], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const zoom = interpolate(frame, [0, DEMO_LEN], [1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <div style={{ transform: `scale(${zoom})` }}>
        <HumanPhone />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 36,
          opacity: captionOpacity,
          fontFamily: fonts.ui,
          fontSize: 20,
          fontWeight: 650,
          color: colors.soft,
          letterSpacing: "0.04em",
          padding: "10px 20px",
          borderRadius: 999,
          background: "rgba(0,0,0,0.55)",
          border: `1px solid ${colors.line}`,
          backdropFilter: "blur(10px)",
        }}
      >
        {beat}
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
        padding: 56,
      }}
    >
      <FadeIn>
        <BrandMark size={32} />
      </FadeIn>
      <FadeIn delay={8}>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonts.display,
            fontSize: 58,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            color: colors.ink,
            textAlign: "center",
            lineHeight: 1.08,
          }}
        >
          OpenClaw · Hermes
        </div>
      </FadeIn>
      <FadeIn delay={14}>
        <div
          style={{
            marginTop: 18,
            fontFamily: fonts.ui,
            fontSize: 24,
            color: colors.muted,
            textAlign: "center",
          }}
        >
          SIP-free. Feels native.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const Soundtrack: React.FC = () => {
  const { outboundAt, deliveredAt, readAt, typingAt, replyAt } = PHONE_BEATS;

  return (
    <>
      <Audio
        src={staticFile("audio/music.wav")}
        volume={(f) =>
          interpolate(f, [0, 20, LAUNCH_DURATION - 30, LAUNCH_DURATION], [0, 0.32, 0.28, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <Sequence from={0} durationInFrames={30}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.55} />
      </Sequence>

      <Sequence from={DEMO_FROM + outboundAt} durationInFrames={20}>
        <Audio src={staticFile("audio/send.wav")} volume={0.7} />
      </Sequence>
      <Sequence from={DEMO_FROM + deliveredAt} durationInFrames={15}>
        <Audio src={staticFile("audio/delivered.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={DEMO_FROM + readAt} durationInFrames={30}>
        <Audio src={staticFile("audio/read.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={DEMO_FROM + typingAt} durationInFrames={70}>
        <Audio src={staticFile("audio/typing.wav")} volume={0.4} loop />
      </Sequence>
      <Sequence from={DEMO_FROM + replyAt} durationInFrames={30}>
        <Audio src={staticFile("audio/reply.wav")} volume={0.7} />
      </Sequence>

      <Sequence from={END_FROM} durationInFrames={40}>
        <Audio src={staticFile("audio/whoosh.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={END_FROM + 12} durationInFrames={50}>
        <Audio src={staticFile("audio/sting.wav")} volume={0.65} />
      </Sequence>
    </>
  );
};

/** Square Twitter/X launch film — ~16s @ 30fps */
export const LaunchVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: colors.bgDeep }}>
      <Atmosphere />
      <Soundtrack />
      <Sequence from={0} durationInFrames={DEMO_FROM}>
        <TitleCard />
      </Sequence>
      <Sequence from={DEMO_FROM} durationInFrames={DEMO_LEN}>
        <DemoScene />
      </Sequence>
      <Sequence from={END_FROM} durationInFrames={END_LEN}>
        <EndCard />
      </Sequence>
    </AbsoluteFill>
  );
};
