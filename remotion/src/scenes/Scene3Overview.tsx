import React from 'react';
import {AbsoluteFill} from 'remotion';
import {loadFont as loadSora} from '@remotion/google-fonts/Sora';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {colors} from '../tokens';
import {FadeUp} from '../components/FadeUp';

const {fontFamily: sora} = loadSora();
const {fontFamily: manrope} = loadManrope();

const StatBox: React.FC<{label: string; value: string; sub: React.ReactNode; win?: boolean}> = ({label, value, sub, win}) => (
  <div style={{background: colors.card2, borderRadius: 20, padding: 26, flex: 1}}>
    <div style={{fontSize: 17, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.dim, marginBottom: 12}}>
      {label}
    </div>
    <div style={{fontFamily: sora, fontWeight: 800, fontSize: 52, color: win ? colors.green : colors.txt}}>{value}</div>
    <div style={{fontSize: 20, color: colors.dim2, marginTop: 10}}>{sub}</div>
  </div>
);

export const Scene3Overview: React.FC = () => {
  return (
    <AbsoluteFill style={{fontFamily: manrope, color: colors.txt, background: colors.bg}}>
      <AbsoluteFill style={{padding: '8% 7%'}}>
        <FadeUp delay={0}>
          <div style={{fontSize: 18, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.dim, marginBottom: 6}}>
            Aujourd'hui — cumulé
          </div>
          <h1 style={{fontFamily: sora, fontWeight: 800, fontSize: 44, margin: '0 0 4px'}}>Vue d'ensemble</h1>
          <p style={{fontSize: 22, color: colors.dim2, margin: '0 0 30px'}}>Vendredi 22 août · tous comptes</p>
        </FadeUp>

        <FadeUp delay={16} style={{background: colors.card, border: '1px solid rgba(255,255,255,.06)', borderRadius: 26, padding: 30}}>
          <div style={{display: 'flex', gap: 20}}>
            <StatBox
              label="Trades pris"
              value="16"
              sub={
                <>
                  <span style={{color: colors.green, fontWeight: 700}}>12 ✓</span>{'  '}
                  <span style={{color: colors.red, fontWeight: 700}}>4 ✗</span>
                </>
              }
            />
            <StatBox label="Résultat cumulé" value="+295$" win sub="2 comptes actifs" />
          </div>
        </FadeUp>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
