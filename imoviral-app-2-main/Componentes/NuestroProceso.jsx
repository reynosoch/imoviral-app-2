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
  gold:         '#A07840',
  bg:           '#FDFBF8',
  textMain:     '#0F0D0A',
  textSub:      '#525252',
  border:       'rgba(160, 120, 64, 0.25)',
  line:         'rgba(0, 0, 0, 0.08)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const STEPS = [
  { id: '01', key: 'consulta' },
  { id: '02', key: 'busqueda' },
  { id: '03', key: 'diligence' },
  { id: '04', key: 'negociacion' },
  { id: '05', key: 'soporte' },
];

export default function NuestroProceso() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const isWide = width > 768;

  return (
    <View style={[s.sectionContainer, { paddingHorizontal: isWide ? 60 : 24 }]}>
      {/* ── Encabezado de Sección Alineado a la Izquierda ── */}
      <View style={s.headerContainer}>
        <View style={s.eyebrowRow}>
          <View style={s.accentLine} />
          <Text style={s.sectionLabel}>{t('process.label')}</Text>
        </View>
        <Text style={s.sectionTitle}>{t('process.title')}</Text>
      </View>

      {/* ── Contenedor de Pasos con Línea Conectora ── */}
      <View style={s.stepsContainer}>
        {/* Línea conectora horizontal (solo en Desktop) */}
        {isWide && (
          <View style={s.connectingLine} />
        )}

        <View style={[s.stepsGrid, isWide ? s.stepsGridRow : s.stepsGridCol]}>
          {STEPS.map((step, idx) => {
            const isHovered = hoveredIndex === idx;

            return (
              <Pressable
                key={step.id}
                onMouseEnter={() => Platform.OS === 'web' && setHoveredIndex(idx)}
                onMouseLeave={() => Platform.OS === 'web' && setHoveredIndex(null)}
                style={[s.stepItem, isWide ? s.stepItemRow : s.stepItemCol]}
              >
                {/* Contenedor del Círculo e Indicador */}
                <View style={s.numContainer}>
                  <View style={[s.stepNumWrap, isHovered && s.stepNumWrapActive]}>
                    <Text style={[s.stepNumText, isHovered && s.stepNumTextActive]}>
                      {step.id}
                    </Text>
                  </View>
                  
                  {/* Punto indicador dorado (efecto visual de hover) */}
                  <View style={[s.dotIndicator, { opacity: isHovered ? 1 : 0 }]} />
                </View>

                {/* Contenido de Texto */}
                <View style={[s.textContainer, !isWide && { alignItems: 'flex-start' }]}>
                  <Text style={[s.stepTitle, isWide ? s.textCenter : s.textLeft]}>
                    {t(`process.${step.key}.t`)}
                  </Text>
                  <Text style={[s.stepDesc, isWide ? s.textCenter : s.textLeft]}>
                    {t(`process.${step.key}.d`)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// ESTILOS DE LA SECCIÓN
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  sectionContainer: {
    backgroundColor: T.bg,
    paddingVertical: 90,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 80,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '400',
    color: T.textMain,
    textAlign: 'left',
  },
  stepsContainer: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    position: 'relative',
  },
  connectingLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: T.line,
    top: 28,
    left: '8%',
    right: '8%',
    zIndex: 0,
  },
  stepsGrid: {
    justifyContent: 'space-between',
    zIndex: 1,
  },
  stepsGridRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
  },
  stepsGridCol: {
    flexDirection: 'column',
    gap: 40,
  },
  stepItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  stepItemRow: {
    flex: 1,
  },
  stepItemCol: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 20,
    width: '100%',
  },
  numContainer: {
    alignItems: 'center',
    position: 'relative',
    height: 76,
  },
  stepNumWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      },
      default: {},
    }),
  },
  stepNumWrapActive: {
    backgroundColor: T.gold,
    borderColor: T.gold,
  },
  stepNumText: {
    fontFamily: T.sans,
    fontSize: 13,
    fontWeight: '600',
    color: T.gold,
    letterSpacing: 0.5,
    ...Platform.select({
      web: {
        transition: 'color 0.3s ease',
      },
      default: {},
    }),
  },
  stepNumTextActive: {
    color: '#FFFFFF',
  },
  dotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: T.gold,
    marginTop: 10,
    ...Platform.select({
      web: {
        transition: 'opacity 0.3s ease',
      },
      default: {},
    }),
  },
  textContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepTitle: {
    fontFamily: T.serif,
    fontSize: 18,
    color: T.textMain,
    fontWeight: '400',
    marginTop: 8,
    marginBottom: 10,
    width: '100%',
  },
  stepDesc: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.textSub,
    lineHeight: 22,
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
  textLeft: {
    textAlign: 'left',
  },
});
