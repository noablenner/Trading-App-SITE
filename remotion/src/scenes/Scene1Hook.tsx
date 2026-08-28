import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors, gradient} from '../tokens';
import {SceneBackground} from '../components/SceneBackground';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

export const Scene1Hook: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt}}>
      <SceneBackground />
      <AbsoluteFill style={{padding: '9% 8%', justifyContent: 'center', gap: 24}}>
        <FadeUp delay={0}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: colors.accent,
              background: 'rgba(162,107,255,.12)',
              border: '1px solid rgba(162,107,255,.35)',
              padding: '10px 20px',
              borderRadius: 999,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: colors.green,
                boxShadow: `0 0 12px ${colors.green}`,
              }}
            />
            Scalping &amp; Prop firm
          </span>
        </FadeUp>

        <FadeUp delay={10}>
          <h1
            style={{
              fontFamily: sora,
              fontWeight: 800,
              fontSize: 88,
              lineHeight: 1.06,
              letterSpacing: '-0.01em',
              margin: '18px 0 0',
            }}
          >
            30 trades dans la journée ?
          </h1>
        </FadeUp>

        <FadeUp delay={22}>
          <p style={{fontSize: 36, color: colors.dim, lineHeight: 1.5, marginTop: 16, maxWidth: '90%'}}>
            Tu <b style={{color: '#fff'}}>coches</b>, tu ne rédiges pas.
          </p>
        </FadeUp>

        <FadeUp delay={40} style={{marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 16}}>
          <span
            style={{
              width: 68,
              height: 68,
              borderRadius: 18,
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: sora,
              fontWeight: 800,
              fontSize: 32,
              color: '#fff',
            }}
          >
            E
          </span>
          <span style={{fontFamily: sora, fontWeight: 800, fontSize: 40}}>Edgio</span>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
