import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';

// Fait apparaître ses enfants en fondu + léger décalage vertical, avec un délai optionnel (en frames)
export const FadeUp: React.FC<{children: React.ReactNode; delay?: number; style?: React.CSSProperties}> = ({
  children,
  delay = 0,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = Math.max(0, frame - delay);

  const progress = spring({fps, frame: local, config: {damping: 200}});
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [24, 0]);

  return (
    <div style={{...style, opacity, transform: `translateY(${translateY}px)`}}>
      {children}
    </div>
  );
};
