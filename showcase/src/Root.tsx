import "./index.css";
import React from "react";
import { Composition } from "remotion";
import { LaunchVideo, LAUNCH_DURATION } from "./LaunchVideo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LaunchVideo"
        component={LaunchVideo}
        durationInFrames={LAUNCH_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
