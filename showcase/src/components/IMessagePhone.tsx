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
        gap: 5,
        alignItems: "center",
        height: 18,
        padding: "0 2px",
      }}
    >
      {[0, 1, 2].map((i) => {
        const wave = Math.sin((frame + i * 6) / 5);
        const y = interpolate(wave, [-1, 1], [3, -4]);
        const opacity = interpolate(wave, [-1, 1], [0.35, 1]);
        return (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
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
  const scale = interpolate(progress, [0, 1], [0.86, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(progress, [0, 1], [18, 0], {
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
        marginBottom: 6,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: typing
            ? colors.bubbleIn
            : isOut
              ? colors.bubbleOut
              : colors.bubbleIn,
          color: isOut && !typing ? "white" : "#f2f2f7",
          borderRadius: typing
            ? 18
            : isOut
              ? "18px 18px 5px 18px"
              : "18px 18px 18px 5px",
          padding: typing ? "12px 14px" : "10px 14px",
          fontFamily: fonts.ui,
          fontSize: 16,
          lineHeight: 1.35,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          boxShadow: isOut
            ? "0 8px 24px rgba(10,132,255,0.25)"
            : "0 8px 24px rgba(0,0,0,0.25)",
        }}
      >
        {typing ? <TypingDots /> : children}
      </div>
    </div>
  );
};

/**
 * Human's phone: outbound message gets Delivered → Read, then agent types and replies.
 */
export const HumanPhone: React.FC<{ style?: React.CSSProperties }> = ({
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const outboundAt = 8;
  const deliveredAt = 36;
  const readAt = 72;
  const typingAt = 96;
  const replyAt = 165;
  const highlightRead = frame >= readAt && frame < typingAt + 20;

  const float = Math.sin(frame / 28) * 6;
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
        width: 340,
        height: 700,
        borderRadius: 48,
        padding: 10,
        background: `linear-gradient(160deg, #3a3a3c 0%, ${colors.phoneBezel} 40%, #0a0a0a 100%)`,
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.18)",
        transform: `translateY(${interpolate(enter, [0, 1], [80, 0]) + float}px) scale(${interpolate(enter, [0, 1], [0.92, 1])})`,
        opacity: enter,
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 40,
          overflow: "hidden",
          background: colors.phoneScreen,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            height: 54,
            padding: "14px 22px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            color: "white",
            fontFamily: fonts.ui,
            fontSize: 14,
            fontWeight: 650,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span>9:41</span>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 10,
              transform: "translateX(-50%)",
              width: 110,
              height: 28,
              borderRadius: 20,
              background: "#000",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
            }}
          />
          <span style={{ opacity: 0.9, fontSize: 12 }}>●●● LTE</span>
        </div>

        <div
          style={{
            background: "rgba(28,28,30,0.92)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            padding: "8px 14px 12px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ color: colors.accent, fontSize: 22, fontWeight: 500 }}>
            ‹
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              background: `linear-gradient(145deg, #34c759, #30d158)`,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ✦
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "white",
                fontFamily: fonts.ui,
                fontWeight: 650,
                fontSize: 15,
                letterSpacing: "-0.02em",
              }}
            >
              Agent
            </div>
            <div
              style={{ color: "#8e8e93", fontSize: 11, fontFamily: fonts.ui }}
            >
              iMessage
            </div>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            padding: "18px 12px 14px",
            background:
              "radial-gradient(600px 400px at 50% 0%, #141418 0%, #000 70%)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              alignSelf: "center",
              color: "#636366",
              fontFamily: fonts.ui,
              fontSize: 11,
              marginBottom: 14,
            }}
          >
            Today 9:41 AM
          </div>

          <Bubble side="out" appearAt={outboundAt}>
            hey — can you check if the deploy is green?
          </Bubble>

          {receiptLabel ? (
            <div
              style={{
                textAlign: "right",
                fontFamily: fonts.ui,
                fontSize: 12,
                color: highlightRead ? colors.accentSoft : "#8e8e93",
                marginTop: 2,
                marginBottom: 8,
                marginRight: 4,
                letterSpacing: "0.01em",
                fontWeight: highlightRead ? 650 : 500,
                textShadow: highlightRead
                  ? "0 0 18px rgba(90,200,250,0.55)"
                  : "none",
                transform: highlightRead ? "scale(1.04)" : "scale(1)",
                transformOrigin: "right center",
              }}
            >
              {receiptLabel}
            </div>
          ) : (
            <div style={{ height: 22 }} />
          )}

          {frame >= typingAt && frame < replyAt ? (
            <Bubble side="in" appearAt={typingAt} typing>
              …
            </Bubble>
          ) : null}

          <Bubble side="in" appearAt={replyAt}>
            Deploy is green. CI passed 4m ago — you’re clear to ship.
          </Bubble>
        </div>

        <div
          style={{
            padding: "10px 12px 18px",
            background: "rgba(28,28,30,0.96)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              height: 34,
              borderRadius: 18,
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#636366",
              fontFamily: fonts.ui,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              padding: "0 12px",
            }}
          >
            iMessage
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 99,
              background: colors.accent,
              opacity: 0.35,
            }}
          />
        </div>
      </div>
    </div>
  );
};
