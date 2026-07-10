import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../theme";

const TypingDots: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        display: "flex",
        gap: 7,
        alignItems: "center",
        height: 22,
        padding: "0 2px",
      }}
    >
      {[0, 1, 2].map((i) => {
        const wave = Math.sin((frame + i * 6) / 5);
        const y = interpolate(wave, [-1, 1], [4, -5]);
        const opacity = interpolate(wave, [-1, 1], [0.35, 1]);
        return (
          <div
            key={i}
            style={{
              width: 9,
              height: 9,
              borderRadius: 99,
              background: "#aeaeb2",
              transform: `translateY(${y}px)`,
              opacity,
            }}
          />
        );
      })}
    </div>
  );
};

type BubbleProps = {
  side: "in" | "out";
  children: React.ReactNode;
  appearAt: number;
  typing?: boolean;
};

const Bubble: React.FC<BubbleProps> = ({
  side,
  children,
  appearAt,
  typing,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.7 },
  });
  const opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(progress, [0, 1], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (frame < appearAt) {
    return null;
  }

  const isOut = side === "out";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOut ? "flex-end" : "flex-start",
        opacity,
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: isOut ? "bottom right" : "bottom left",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          maxWidth: "84%",
          background: typing
            ? colors.bubbleIn
            : isOut
              ? colors.bubbleOut
              : colors.bubbleIn,
          color: isOut && !typing ? "white" : "#f2f2f7",
          borderRadius: typing
            ? 22
            : isOut
              ? "22px 22px 6px 22px"
              : "22px 22px 22px 6px",
          padding: typing ? "16px 18px" : "14px 18px",
          fontFamily: fonts.ui,
          fontSize: 28,
          lineHeight: 1.3,
          fontWeight: 500,
          letterSpacing: "-0.015em",
          boxShadow: isOut
            ? "0 10px 28px rgba(10,132,255,0.28)"
            : "0 10px 28px rgba(0,0,0,0.28)",
        }}
      >
        {typing ? <TypingDots /> : children}
      </div>
    </div>
  );
};

/** Timeline offsets used by audio cues in LaunchVideo */
export const PHONE_BEATS = {
  outboundAt: 10,
  deliveredAt: 38,
  readAt: 74,
  typingAt: 100,
  replyAt: 170,
} as const;

/**
 * Square-friendly Messages panel — fills most of a 1080×1080 frame.
 */
export const HumanPhone: React.FC<{
  style?: React.CSSProperties;
}> = ({ style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { outboundAt, deliveredAt, readAt, typingAt, replyAt } = PHONE_BEATS;
  const highlightRead = frame >= readAt && frame < typingAt + 18;

  const enter = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 90 },
  });

  const receiptLabel =
    frame >= readAt ? "Read" : frame >= deliveredAt ? "Delivered" : "";

  return (
    <div
      style={{
        width: 1000,
        height: 1000,
        borderRadius: 52,
        padding: 14,
        background: `linear-gradient(160deg, #3a3a3c 0%, ${colors.phoneBezel} 45%, #0a0a0a 100%)`,
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.16)",
        transform: `translateY(${interpolate(enter, [0, 1], [36, 0])}px) scale(${interpolate(enter, [0, 1], [0.94, 1])})`,
        opacity: enter,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 44,
          overflow: "hidden",
          background: colors.phoneScreen,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            background: "rgba(28,28,30,0.96)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "22px 22px 18px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div style={{ color: colors.accent, fontSize: 30, fontWeight: 500 }}>
            ‹
          </div>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 99,
              background: `linear-gradient(145deg, #34c759, #30d158)`,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            ✦
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "white",
                fontFamily: fonts.ui,
                fontWeight: 700,
                fontSize: 24,
                letterSpacing: "-0.02em",
              }}
            >
              Agent
            </div>
            <div
              style={{ color: "#8e8e93", fontSize: 15, fontFamily: fonts.ui }}
            >
              iMessage
            </div>
          </div>
          <div
            style={{
              color: "#8e8e93",
              fontFamily: fonts.ui,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            9:41
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "28px 22px 24px",
            background:
              "radial-gradient(700px 500px at 50% 0%, #16161a 0%, #000 75%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              alignSelf: "center",
              color: "#636366",
              fontFamily: fonts.ui,
              fontSize: 15,
              marginBottom: 28,
            }}
          >
            Today 9:41 AM
          </div>

          <Bubble side="out" appearAt={outboundAt}>
            hey — is the deploy green?
          </Bubble>

          {receiptLabel ? (
            <div
              style={{
                textAlign: "right",
                fontFamily: fonts.ui,
                fontSize: 18,
                color: highlightRead ? colors.accentSoft : "#8e8e93",
                marginTop: 4,
                marginBottom: 14,
                marginRight: 6,
                letterSpacing: "0.01em",
                fontWeight: highlightRead ? 700 : 500,
                textShadow: highlightRead
                  ? "0 0 22px rgba(90,200,250,0.65)"
                  : "none",
                transform: highlightRead ? "scale(1.06)" : "scale(1)",
                transformOrigin: "right center",
              }}
            >
              {receiptLabel}
            </div>
          ) : (
            <div style={{ height: 36 }} />
          )}

          {frame >= typingAt && frame < replyAt ? (
            <Bubble side="in" appearAt={typingAt} typing>
              …
            </Bubble>
          ) : null}

          <Bubble side="in" appearAt={replyAt}>
            All green. You’re clear to ship.
          </Bubble>
        </div>

        <div
          style={{
            padding: "16px 18px 26px",
            background: "rgba(28,28,30,0.98)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 46,
              borderRadius: 24,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#636366",
              fontFamily: fonts.ui,
              fontSize: 18,
              display: "flex",
              alignItems: "center",
              padding: "0 18px",
            }}
          >
            iMessage
          </div>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 99,
              background: colors.accent,
              opacity: 0.4,
            }}
          />
        </div>
      </div>
    </div>
  );
};
