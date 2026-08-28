import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors} from '../tokens';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

export const Scene5Insight: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt, background: colors.bg}}>
      <AbsoluteFill style={{padding: '8% 7%'}}>
        <FadeUp delay={0}>
          <div style={{fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.dim, opacity: 0.7}}>
            Analyse
          </div>
          <h1 style={{fontFamily: sora, fontWeight: 800, fontSize: 40, margin: '4px 0 0'}}>Ce qui te fait gagner</h1>
        </FadeUp>

        <FadeUp
          delay={16}
          style={{
            background: 'linear-gradient(160deg, rgba(200,31,224,.14), rgba(86,56,232,.1))',
            border: '1px solid rgba(162,107,255,.3)',
            borderRadius: 26,
            padding: 34,
            marginTop: 26,
          }}
        >
          <h3 style={{fontFamily: sora, fontWeight: 700, fontSize: 22, color: colors.accent, margin: '0 0 14px', letterSpacing: '0.03em'}}>
            RESPECT DES RÈGLES
          </h3>
          <p style={{fontSize: 28, lineHeight: 1.55, margin: 0, color: colors.txt}}>
            Quand tu respectes toutes tes règles : <span style={{fontFamily: sora, fontWeight: 800, fontSize: 34, color: colors.green}}>+142$</span> en
            moyenne.
            <br />
            Quand tu en enfreins une : <span style={{fontFamily: sora, fontWeight: 800, fontSize: 34, color: colors.red}}>−96$</span>.
          </p>
          <div style={{display: 'flex', gap: 16, marginTop: 24}}>
            <div style={{flex: 1, borderRadius: 16, padding: 20, textAlign: 'center', fontFamily: sora, fontWeight: 800, fontSize: 28, background: colors.green, color: '#062017'}}>
              +142
            </div>
            <div style={{flex: 1, borderRadius: 16, padding: 20, textAlign: 'center', fontFamily: sora, fontWeight: 800, fontSize: 28, background: colors.red, color: '#2b0708'}}>
              −96
            </div>
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
