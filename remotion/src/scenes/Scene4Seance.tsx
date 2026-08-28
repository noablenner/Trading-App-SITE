import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors, gradient} from '../tokens';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

// true = gagnant, false = perdant, null = case vide
const trades: (boolean | null)[] = [true, true, false, true, true, true, false, true, true, true, true, false, null, null, null, null, null, null];

export const Scene4Seance: React.FC = () => {
  const frame = useCurrentFrame();
  const progressWidth = interpolate(frame, [10, 50], [0, 40], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt, background: colors.bg}}>
      <AbsoluteFill style={{padding: '8% 7%'}}>
        <FadeUp delay={0}>
          <div style={{fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.dim, opacity: 0.7}}>
            12 / 30 trades
          </div>
          <h1 style={{fontFamily: sora, fontWeight: 800, fontSize: 40, margin: '4px 0 0'}}>Séance du jour</h1>
        </FadeUp>

        <div style={{height: 14, borderRadius: 999, background: colors.card2, overflow: 'hidden', margin: '26px 0 30px'}}>
          <div style={{height: '100%', background: gradient, width: `${progressWidth}%`, borderRadius: 999}} />
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12}}>
          {trades.map((t, i) => (
            <FadeUp key={i} delay={20 + i * 3}>
              <div
                style={{
                  aspectRatio: '1',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 700,
                  ...(t === true && {background: 'rgba(52,211,153,.14)', border: '1px solid rgba(52,211,153,.5)', color: colors.green}),
                  ...(t === false && {background: 'rgba(248,113,122,.14)', border: '1px solid rgba(248,113,122,.5)', color: colors.red}),
                  ...(t === null && {background: colors.card2, color: colors.dim2}),
                }}
              >
                {t === true ? '✓' : t === false ? '✗' : i + 1}
              </div>
            </FadeUp>
          ))}
        </div>

        <FadeUp delay={70} style={{marginTop: 36, display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color: colors.dim}}>
          🔥 Règles respectées 4/5 · streak <b style={{color: colors.txt}}>&nbsp;6 jours</b>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
