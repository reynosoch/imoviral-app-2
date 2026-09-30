import React, { useState } from 'react';
import {
  Image,
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
  bgSection:    '#F2EDE5',
  bgCard:       '#FFFFFF',
  textMain:     '#0F0D0A',
  textSub:      '#525252',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const SOLUTIONS_DATA = [
  {
    id: 'card1',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    onPressDest: 'venta'
  },
  {
    id: 'card2',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    onPressDest: 'venta'
  }
];

export default function NuestrasSoluciones({ onNavigate }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [hoveredCardId, setHoveredCardId] = useState(null);

  const isWide = width > 768;

  return (
    <View style={[s.sectionContainer, { paddingHorizontal: isWide ? 60 : 24 }]}>
      {/* ── Encabezado de Sección ── */}
      <View style={s.headerContainer}>
        <Text style={s.sectionLabel}>{t('solutions.label')}</Text>
        <Text style={s.sectionTitle}>{t('solutions.title')}</Text>
      </View>

      {/* ── Contenedor de Tarjetas ── */}
      <View style={s.cardsWrapper}>
        <View style={[s.cardsGrid, isWide ? s.cardsGridRow : s.cardsGridCol]}>
          {SOLUTIONS_DATA.map((item) => {
            const isHovered = hoveredCardId === item.id;

            return (
              <Pressable
                key={item.id}
                onMouseEnter={() => Platform.OS === 'web' && setHoveredCardId(item.id)}
                onMouseLeave={() => Platform.OS === 'web' && setHoveredCardId(null)}
                onPress={() => typeof onNavigate === 'function' && onNavigate(item.onPressDest)}
                style={[
                  s.card,
                  isWide ? s.cardWide : s.cardMobile,
                  isHovered && s.cardHovered,
                ]}
              >
                <View style={[s.cardInner, isWide ? s.cardInnerRow : s.cardInnerCol]}>
                  {/* Lado Izquierdo: Textos */}
                  <View style={s.textCol}>
                    <Text style={s.cardTag}>{t(`solutions.${item.id}.tag`)}</Text>
                    <Text style={s.cardTitle}>{t(`solutions.${item.id}.title`)}</Text>
                    <Text style={s.cardDesc} numberOfLines={isWide ? 5 : undefined}>
                      {t(`solutions.${item.id}.desc`)}
                    </Text>
                    
                    {/* Botón de Enlace */}
                    <View style={s.linkWrap}>
                      <Text style={s.linkText}>{t(`solutions.${item.id}.cta`)}</Text>
                    </View>
                  </View>

                  {/* Lado Derecho: Imagen */}
                  <View style={[s.imgCol, isWide ? s.imgColWide : s.imgColMobile]}>
                    <Image
                      source={{ uri: item.image }}
                      style={[
                        s.cardImg,
                        isHovered && s.cardImgZoomed
                      ]}
                      resizeMode="cover"
                    />
                  </View>
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
    backgroundColor: T.bgSection,
    paddingVertical: 90,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.03)',
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 60,
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  sectionLabel: {
    color: T.gold,
    fontFamily: T.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: T.serif,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '400',
    color: T.textMain,
  },
  cardsWrapper: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  cardsGrid: {
    justifyContent: 'space-between',
    gap: 30,
  },
  cardsGridRow: {
    flexDirection: 'row',
  },
  cardsGridCol: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: T.bgCard,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  cardWide: {
    flex: 1,
    minWidth: 480,
  },
  cardMobile: {
    width: '100%',
  },
  cardHovered: {
    transform: [{ translateY: -4 }],
    ...Platform.select({
      web: {
        boxShadow: '0 12px 24px rgba(0, 0, 0, 0.08)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
      },
    }),
  },
  cardInner: {
    width: '100%',
  },
  cardInnerRow: {
    flexDirection: 'row',
    height: 250,
  },
  cardInnerCol: {
    flexDirection: 'column-reverse',
  },
  textCol: {
    flex: 1.2,
    padding: 30,
    justifyContent: 'center',
  },
  imgCol: {
    overflow: 'hidden',
  },
  imgColWide: {
    width: 200,
    height: '100%',
  },
  imgColMobile: {
    width: '100%',
    height: 200,
  },
  cardImg: {
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        transition: 'transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
      },
      default: {},
    }),
  },
  cardImgZoomed: {
    transform: [{ scale: 1.05 }],
  },
  cardTag: {
    color: T.gold,
    fontFamily: T.sans,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontFamily: T.serif,
    fontSize: 22,
    lineHeight: 26,
    color: T.textMain,
    marginBottom: 12,
  },
  cardDesc: {
    fontFamily: T.sans,
    fontSize: 12,
    lineHeight: 18,
    color: T.textSub,
    marginBottom: 16,
  },
  linkWrap: {
    borderBottomWidth: 1,
    borderBottomColor: T.gold,
    alignSelf: 'flex-start',
    paddingBottom: 2,
  },
  linkText: {
    fontFamily: T.sans,
    fontSize: 10,
    fontWeight: '700',
    color: T.textMain,
    letterSpacing: 1,
  },
});
