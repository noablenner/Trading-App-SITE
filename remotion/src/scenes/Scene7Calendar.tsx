import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors} from '../tokens';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

type Day = {n: number; v?: number} | null;

const days: Day[] = [
  null, null, null, null, {n: 1, v: 182}, null, null,
  {n: 4, v: 15}, {n: 5, v: -40}, {n: 6, v: 210}, null, {n: 8, v: 75}, null, null,
  {n: 11, v: 95}, {n: 12, v: -40}, {n: 13, v: 150}, null, {n: 15, v: -60}, null, null,
  {n: 18, v: 60}, {n: 19, v: 180}, {n: 20, v: -110}, {n: 21, v: 220}, {n: 22, v: 295}, null, null,
];

export const Scene7Calendar: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt, background: colors.bg}}>
      <AbsoluteFill style={{padding: '8% 7%'}}>
        <FadeUp delay={0}>
          <div style={{fontSize: 18, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.dim, opacity: 0.7}}>
            Août
          </div>
          <h1 style={{fontFamily: sora, fontWeight: 800, fontSize: 40, margin: '4px 0 0'}}>Calendrier cumulé</h1>
        </FadeUp>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginTop: 26}}>
          {days.map((d, i) => {
            if (!d) return <div key={i} />;
            const pos = (d.v ?? 0) >= 0;
            const isLast = d.n === 22;
            return (
              <FadeUp key={i} delay={16 + i * 2}>
                <div
                  style={{
                    aspectRatio: '1',
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 700,
                    color: pos ? colors.green : colors.red,
                    background: pos ? 'rgba(52,211,153,.18)' : 'rgba(248,113,122,.18)',
                    border: `1px solid ${pos ? 'rgba(52,211,153,.4)' : 'rgba(248,113,122,.4)'}`,
                    outline: isLast ? `2px solid ${colors.accent}` : 'none',
                  }}
                >
                  <span>{d.n}</span>
                  <span style={{fontSize: 13}}>{d.v! >= 0 ? `+${d.v}` : d.v}</span>
                </div>
              </FadeUp>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
