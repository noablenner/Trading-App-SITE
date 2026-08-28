import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors} from '../tokens';
import {SceneBackground} from '../components/SceneBackground';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

export const Scene6BigStat: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt}}>
      <SceneBackground />
      <AbsoluteFill style={{padding: '9% 8%', justifyContent: 'center', alignItems: 'flex-start'}}>
        <FadeUp delay={0}>
          <div style={{fontSize: 20, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.dim}}>
            Séances taguées « revenge »
          </div>
        </FadeUp>
        <FadeUp delay={12}>
          <div style={{fontFamily: sora, fontWeight: 800, fontSize: 140, lineHeight: 1, margin: '18px 0 14px', color: colors.red}}>
            −180$
          </div>
        </FadeUp>
        <FadeUp delay={26}>
          <p style={{fontSize: 28, color: colors.dim, maxWidth: '85%', lineHeight: 1.5}}>
            en moyenne. Edgio détecte le pattern avant qu'il ne coûte ton compte financé.
          </p>
        </FadeUp>
        <FadeUp
          delay={44}
          style={{
            marginTop: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            background: colors.card,
            borderRadius: 20,
            padding: '20px 26px',
            alignSelf: 'stretch',
          }}
        >
          <span style={{fontSize: 32}}>🔥</span>
          <span style={{fontFamily: sora, fontWeight: 800, fontSize: 32}}>6 jours</span>
          <span style={{color: colors.dim, fontWeight: 500, fontSize: 26}}>de streak discipline</span>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
