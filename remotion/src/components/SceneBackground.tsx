import React from 'react';
import {colors} from '../tokens';

export const SceneBackground: React.FC<{aurora?: boolean}> = ({aurora = true}) => {
  return (
    <div style={{position: 'absolute', inset: 0, background: colors.bg}}>
      {aurora && (
        <>
          <Blob top="-14%" left="-16%" size="70%" color={colors.magenta} />
          <Blob top="-4%" right="-18%" size="66%" color={colors.indigo} />
          <Blob bottom="6%" left="18%" size="60%" color={colors.violet} opacity={0.4} />
        </>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px)',
          backgroundSize: '38px 38px',
          maskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(circle at 50% 30%, #000 0%, transparent 75%)',
        }}
      />
    </div>
  );
};

const Blob: React.FC<{
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  size: string;
  color: string;
  opacity?: number;
}> = ({top, left, right, bottom, size, color, opacity = 0.55}) => (
  <div
    style={{
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width: size,
      height: size,
      borderRadius: '50%',
      filter: 'blur(60px)',
      opacity,
      background: `radial-gradient(circle, ${color}, transparent 65%)`,
    }}
  />
);
