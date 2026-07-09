import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { colors, fonts } from "../theme";

export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 14;
  const drift2 = Math.cos(frame / 55) * 16;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 900px at ${50 + drift * 0.08}% ${30 + drift2 * 0.05}%, ${colors.bgGlow} 0%, ${colors.bgMid} 45%, ${colors.bgDeep} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          opacity: 0.28,
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(420px 420px at 70% 75%, rgba(10,132,255,0.2), transparent 70%)`,
          transform: `translateY(${drift}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(360px 360px at 20% 80%, rgba(90,200,250,0.12), transparent 70%)`,
          transform: `translateY(${-drift2}px)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, stiffness: 80 },
  });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const y = interpolate(progress, [0, 1], [22, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, ...style }}>
      {children}
    </div>
  );
};

export const BrandMark: React.FC<{ size?: number }> = ({ size = 22 }) => {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
        fontFamily: fonts.display,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.035em",
        color: colors.ink,
      }}
    >
      <div
        style={{
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: size * 0.34,
          background: `linear-gradient(145deg, ${colors.accentSoft}, ${colors.accent})`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.12), 0 10px 30px rgba(10,132,255,0.35)`,
          display: "grid",
          placeItems: "center",
          color: "white",
          fontSize: size * 0.58,
          fontWeight: 800,
        }}
      >
        i
      </div>
      iMessages Server
    </div>
  );
};
