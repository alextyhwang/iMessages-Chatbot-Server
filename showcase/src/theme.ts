import { loadFont as loadOutfit } from "@remotion/google-fonts/Outfit";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

const outfit = loadOutfit("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const jakarta = loadJakarta("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

export const fonts = {
  display: outfit.fontFamily,
  ui: jakarta.fontFamily,
};

export const colors = {
  bgDeep: "#07090c",
  bgMid: "#10151c",
  bgGlow: "#1a2740",
  ink: "#f4f7fb",
  muted: "#9aa7b8",
  soft: "#c5d0de",
  accent: "#0a84ff",
  accentSoft: "#5ac8fa",
  bubbleOut: "#0a84ff",
  bubbleIn: "#2c2c2e",
  phoneBezel: "#1c1c1e",
  phoneScreen: "#000000",
  navBar: "#1c1c1e",
  success: "#30d158",
  line: "rgba(255,255,255,0.08)",
};
