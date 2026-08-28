import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors, gradient} from '../tokens';
import {SceneBackground} from '../components/SceneBackground';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

export const Scene8Outro: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt}}>
      <SceneBackground />
      <AbsoluteFill style={{padding: '9% 8%', justifyContent: 'center', alignItems: 'center', textAlign: 'center'}}>
        <FadeUp delay={0}>
          <span
            style={{
              width: 100,
              height: 100,
              borderRadius: 26,
              background: gradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: sora,
              fontWeight: 800,
              fontSize: 44,
              color: '#fff',
              marginBottom: 30,
            }}
          >
            E
          </span>
        </FadeUp>
        <FadeUp delay={12}>
          <h1 style={{fontFamily: sora, fontWeight: 800, fontSize: 56, margin: '0 0 16px'}}>
            La discipline que ton challenge exige.
          </h1>
        </FadeUp>
        <FadeUp delay={24}>
          <p style={{color: colors.dim, fontSize: 28, lineHeight: 1.5, maxWidth: '80%'}}>
            14 jours de premium offerts, sans carte bancaire.
          </p>
        </FadeUp>
        <FadeUp delay={38}>
          <div
            style={{
              marginTop: 36,
              padding: '20px 44px',
              borderRadius: 999,
              background: gradient,
              color: '#fff',
              fontWeight: 800,
              fontSize: 28,
              fontFamily: sora,
            }}
          >
            Commencer gratuitement
          </div>
        </FadeUp>
        <FadeUp delay={48}>
          <div style={{marginTop: 22, color: colors.dim2, fontSize: 24, letterSpacing: '0.02em'}}>edgio.fr</div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
