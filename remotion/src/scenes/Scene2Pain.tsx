import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors} from '../tokens';
import {SceneBackground} from '../components/SceneBackground';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

const points = ['Rédiger après chaque position', 'Perdre le fil de ton quota', 'Découvrir la règle enfreinte trop tard'];

export const Scene2Pain: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt}}>
      <SceneBackground aurora={false} />
      <AbsoluteFill style={{padding: '9% 8%', justifyContent: 'center'}}>
        <FadeUp delay={0}>
          <div style={{fontSize: 20, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.red, marginBottom: 16}}>
            Le vrai problème
          </div>
        </FadeUp>
        <FadeUp delay={8}>
          <h1 style={{fontFamily: sora, fontWeight: 800, fontSize: 66, lineHeight: 1.14, margin: 0}}>
            Un journal <span style={{color: colors.dim2, textDecoration: 'line-through', textDecorationColor: colors.red}}>qui te fait perdre 20 min</span> par trade, ça ne tient pas un challenge.
          </h1>
        </FadeUp>

        <div style={{marginTop: 40, display: 'flex', flexDirection: 'column', gap: 20}}>
          {points.map((p, i) => (
            <FadeUp key={p} delay={26 + i * 10} style={{display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, color: colors.dim}}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(248,113,122,.15)',
                  color: colors.red,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  flex: 'none',
                }}
              >
                ✕
              </span>
              {p}
            </FadeUp>
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
