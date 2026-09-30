import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────
// TOKENS DE DISEÑO OFICIALES (INMOVIRAL MATCHED)
// ─────────────────────────────────────────────
const T = {
  gold:         '#C49A58',
  goldSoli:     '#A07840',
  bgSection:    '#1C1812',
  textMain:     '#FFFFFF',
  textSub:      'rgba(255, 255, 255, 0.65)',
  borderThin:   'rgba(255, 255, 255, 0.07)',
  borderBtn:    'rgba(160, 120, 64, 0.4)',
  hoverStat:    'rgba(160, 120, 64, 0.08)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

export default function SobreNosotrosSection({ onNavigate }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [hoveredBtn, setHoveredBtn] = useState(false);
  const [hoveredStatIdx, setHoveredStatIdx] = useState(null);

  const isWide = width > 1024;
  const isTabletOrWide = width > 768;

  const stats = [
    { num: t('about.stat1_num'), suffix: t('about.stat1_suffix'), desc: t('about.stat1_desc') },
    { num: t('about.stat2_num'), suffix: t('about.stat2_suffix'), desc: t('about.stat2_desc') },
    { num: t('about.stat3_num'), suffix: t('about.stat3_suffix'), desc: t('about.stat3_desc') }
  ];

  // Separar los párrafos de la descripción por el salto de línea doble
  const paragraphs = (t('about.desc') || '').split('\n\n');

  return (
    <View style={[s.sectionContainer, { paddingHorizontal: isTabletOrWide ? 60 : 24 }]}>
      <View style={[s.mainGrid, isWide ? s.mainGridRow : s.mainGridCol]}>
        
        {/* ── Columna Izquierda: Filosofía ── */}
        <View style={[s.leftCol, isWide ? s.leftColWide : s.leftColMobile]}>
          <View style={s.eyebrowRow}>
            <View style={s.accentLine} />
            <Text style={s.sectionLabel}>{t('about.label')}</Text>
          </View>
          <Text style={s.sectionTitle}>{t('about.title')}</Text>
          
          <View style={s.descContainer}>
            {paragraphs.map((pText, pIdx) => (
              <Text key={pIdx} style={[s.sectionDesc, pIdx > 0 && { marginTop: 16 }]}>
                {pText}
              </Text>
            ))}
          </View>
          
          <Pressable
            onPress={() => typeof onNavigate === 'function' && onNavigate('nosotros')}
            onMouseEnter={() => Platform.OS === 'web' && setHoveredBtn(true)}
            onMouseLeave={() => Platform.OS === 'web' && setHoveredBtn(false)}
            style={[
              s.btnOutline,
              hoveredBtn && s.btnOutlineHovered
            ]}
          >
            <Text style={[s.btnText, hoveredBtn && s.btnTextHovered]}>
              {t('about.cta')}
            </Text>
          </Pressable>
        </View>

        {/* ── Columna Derecha: Estadísticas ── */}
        <View style={[s.rightCol, isWide ? s.rightColWide : s.rightColMobile]}>
          <View style={[s.statsOuterContainer, isWide ? s.statsOuterRow : s.statsOuterCol]}>
            {stats.map((stat, idx) => {
              const isHovered = hoveredStatIdx === idx;
              
              // Separadores responsivos
              const borderStyles = [];
              if (isWide) {
                // Bordes verticales a la derecha en desktop
                if (idx < 2) {
                  borderStyles.push({ borderRightWidth: 1, borderRightColor: T.borderThin });
                }
              } else {
                // Bordes horizontales abajo en móvil
                if (idx < 2) {
                  borderStyles.push({ borderBottomWidth: 1, borderBottomColor: T.borderThin });
                }
              }

              return (
                <View
                  key={idx}
                  onMouseEnter={() => Platform.OS === 'web' && setHoveredStatIdx(idx)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoveredStatIdx(null)}
                  style={[
                    s.statBox,
                    borderStyles,
                    isHovered && s.statBoxHovered
                  ]}
                >
                  <Text style={s.statVal}>
                    {stat.num}
                    {stat.suffix ? (
                      <Text style={s.statSuffix}>
                        {stat.suffix}
                      </Text>
                    ) : null}
                  </Text>
                  <Text style={s.statDesc}>{stat.desc}</Text>
                </View>
              );
            })}
          </View>
        </View>

      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// ESTILOS DEL COMPONENTE
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  sectionContainer: {
    backgroundColor: T.bgSection,
    paddingVertical: 100,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.02)',
  },
  mainGrid: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    justifyContent: 'space-between',
    gap: 50,
  },
  mainGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainGridCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  leftCol: {
    justifyContent: 'center',
  },
  leftColWide: {
    flex: 1.1,
    paddingRight: 40,
  },
  leftColMobile: {
    width: '100%',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  accentLine: {
    width: 32,
    height: 1,
    backgroundColor: T.gold,
    marginRight: 12,
  },
  sectionLabel: {
    color: T.gold,
    fontFamily: T.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontFamily: T.serif,
    fontSize: 46,
    lineHeight: 52,
    fontWeight: '400',
    color: T.textMain,
    marginBottom: 28,
  },
  descContainer: {
    marginBottom: 36,
  },
  sectionDesc: {
    fontFamily: T.sans,
    fontSize: 13,
    lineHeight: 24,
    color: T.textSub,
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: T.borderBtn,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      },
      default: {},
    }),
  },
  btnOutlineHovered: {
    backgroundColor: T.goldSoli,
    borderColor: T.goldSoli,
  },
  btnText: {
    fontFamily: T.sans,
    fontSize: 11,
    fontWeight: '600',
    color: T.gold,
    letterSpacing: 2,
    ...Platform.select({
      web: {
        transition: 'color 0.3s ease',
      },
      default: {},
    }),
  },
  btnTextHovered: {
    color: '#FFFFFF',
  },
  rightCol: {
    justifyContent: 'center',
  },
  rightColWide: {
    flex: 0.9,
  },
  rightColMobile: {
    width: '100%',
  },
  statsOuterContainer: {
    borderWidth: 1,
    borderColor: T.borderThin,
    backgroundColor: 'transparent',
  },
  statsOuterRow: {
    flexDirection: 'row',
    height: 240,
  },
  statsOuterCol: {
    flexDirection: 'column',
  },
  statBox: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'background-color 0.3s ease',
      },
      default: {},
    }),
  },
  statBoxHovered: {
    backgroundColor: T.hoverStat,
  },
  statVal: {
    fontFamily: T.serif,
    fontSize: 48,
    color: T.textMain,
    marginBottom: 12,
  },
  statSuffix: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.gold,
    marginLeft: 2,
    textTransform: 'lowercase',
  },
  statDesc: {
    fontFamily: T.sans,
    fontSize: 12,
    lineHeight: 18,
    color: T.textSub,
  },
});
