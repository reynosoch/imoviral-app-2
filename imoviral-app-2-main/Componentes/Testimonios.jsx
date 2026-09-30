import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';

// ─────────────────────────────────────────────
// TOKENS DE DISEÑO OFICIALES (INMOVIRAL MATCHED)
// ─────────────────────────────────────────────
const T = {
  gold:         '#A07840',
  bgSection:    '#EAE2D6',
  bgCard:       '#FFFFFF',
  textMain:     '#0F0D0A',
  textSub:      '#525252',
  borderLine:   'rgba(0,0,0,0.05)',
  serif:        Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:         Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

export default function Testimonios({ onNavigate }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [hoveredBtn, setHoveredBtn] = useState(false);

  const isWide = width > 768;

  // DB reviews
  const [dbResenas, setDbResenas] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Load reviews from Supabase
  useEffect(() => {
    const cargar = async () => {
      try {
        const { data, error } = await supabase
          .from('resenas')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          setDbResenas(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    cargar();
  }, []);

  const defaultResenas = [
    {
      id: 'testi1',
      user_name: 'Mauro Lombardo',
      avatar: require('../assets/mauro.jpg'),
      role: t('testimonials.testi1.r'),
      estrellas: 5,
      comentario: t('testimonials.testi1.q'),
    },
    {
      id: 'testi2',
      user_name: 'Benito Ocasio',
      avatar: require('../assets/benito.jpg'),
      role: t('testimonials.testi2.r'),
      estrellas: 5,
      comentario: t('testimonials.testi2.q'),
    },
    {
      id: 'testi3',
      user_name: 'Michael Torres',
      avatar: require('../assets/michael.jpg'),
      role: t('testimonials.testi3.r'),
      estrellas: 5,
      comentario: t('testimonials.testi3.q'),
    },
  ];

  // Map DB reviews to have similar fields
  const formattedDb = dbResenas.map(item => ({
    id: item.id,
    user_name: item.user_name,
    avatar: item.avatar_url ? { uri: item.avatar_url } : null,
    role: item.role || 'Cliente verificado',
    estrellas: item.estrellas,
    comentario: item.comentario,
  }));

  const todas = [...formattedDb, ...defaultResenas];

  const transitionToNext = useCallback((nextIndex) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setActiveIndex(nextIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  }, [fadeAnim]);

  // Auto scroll testimonials
  useEffect(() => {
    const totalVisibleLimit = isWide ? 3 : 1;
    if (todas.length <= totalVisibleLimit) return;

    const interval = setInterval(() => {
      const nextIdx = (activeIndex + 1) % todas.length;
      transitionToNext(nextIdx);
    }, 6000);

    return () => clearInterval(interval);
  }, [todas.length, activeIndex, isWide, transitionToNext]);

  // Determine what to show
  const getVisibleReviews = () => {
    if (todas.length === 0) return [];
    if (!isWide) {
      return [todas[activeIndex]];
    }
    // Desktop layout (show 3 cards)
    if (todas.length <= 3) return todas;
    return [
      todas[activeIndex],
      todas[(activeIndex + 1) % todas.length],
      todas[(activeIndex + 2) % todas.length],
    ];
  };

  const visibleReviews = getVisibleReviews();

  return (
    <View style={[s.sectionContainer, { paddingHorizontal: isWide ? 60 : 24 }]}>
      {/* Header */}
      <View style={s.headerContainer}>
        <Text style={s.sectionLabel}>{t('testimonials.label')}</Text>
        <Text style={s.sectionTitle}>{t('testimonials.title')}</Text>
      </View>

      {/* Cards Grid */}
      <View style={s.cardsWrapper}>
        <Animated.View style={{ opacity: fadeAnim }}>
          <View style={[s.cardsGrid, isWide ? s.cardsGridRow : s.cardsGridCol]}>
            {visibleReviews.map((item) => {
              const isHovered = hoveredCardId === item.id;

              return (
                <Pressable
                  key={item.id}
                  onMouseEnter={() => Platform.OS === 'web' && setHoveredCardId(item.id)}
                  onMouseLeave={() => Platform.OS === 'web' && setHoveredCardId(null)}
                  style={[
                    s.card,
                    isWide ? s.cardWide : s.cardMobile,
                    isHovered && s.cardHovered,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.quoteMark}>{'\u201C'}</Text>
                    <Text style={s.comentarioText}>{item.comentario}</Text>
                  </View>
                  <View style={s.separator} />
                  <View style={s.authorRow}>
                    {item.avatar ? (
                      <Image source={item.avatar} style={s.avatarImage} />
                    ) : (
                      <View style={[s.avatarImage, { backgroundColor: T.gold, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '600' }}>
                          {(item.user_name || 'U').substring(0, 2).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={s.authorInfo}>
                      <Text style={s.authorName}>{item.user_name}</Text>
                      <Text style={s.authorMeta}>{item.role}</Text>
                    </View>
                  </View>
                  <View style={s.starsRow}>
                    {Array.from({ length: item.estrellas }).map((_, starIdx) => (
                      <Text key={starIdx} style={s.starIcon}>{'\u2605'}</Text>
                    ))}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>

      {/* Pagination dots */}
      {todas.length > (isWide ? 3 : 1) && (
        <View style={s.dotsRow}>
          {todas.map((_, idx) => {
            const active = idx === activeIndex;
            return (
              <Pressable
                key={idx}
                onPress={() => transitionToNext(idx)}
                style={[s.dot, active && s.dotActive]}
              />
            );
          })}
        </View>
      )}

      {/* CTA Button to full reviews page */}
      {onNavigate && (
        <View style={s.ctaContainer}>
          <Pressable
            onPress={() => onNavigate('resenas')}
            onMouseEnter={() => Platform.OS === 'web' && setHoveredBtn(true)}
            onMouseLeave={() => Platform.OS === 'web' && setHoveredBtn(false)}
            style={[s.ctaBtn, hoveredBtn && s.ctaBtnHovered]}
          >
            <Text style={[s.ctaBtnText, hoveredBtn && s.ctaBtnTextHovered]}>
              {t('reviews.see_all')}
            </Text>
          </Pressable>
        </View>
      )}
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
    padding: 36,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    position: 'relative',
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
    minWidth: 280,
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
  quoteMark: {
    fontFamily: T.serif,
    fontSize: 54,
    color: T.gold,
    lineHeight: 42,
    height: 32,
    marginTop: -10,
    marginBottom: 8,
  },
  comentarioText: {
    fontFamily: T.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 24,
    color: T.textSub,
    marginBottom: 24,
  },
  separator: {
    height: 1,
    backgroundColor: T.borderLine,
    marginBottom: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    resizeMode: 'cover',
  },
  authorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: T.sans,
    fontSize: 13,
    fontWeight: '600',
    color: T.textMain,
    marginBottom: 2,
  },
  authorMeta: {
    fontFamily: T.sans,
    fontSize: 11,
    color: T.gold,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  starIcon: {
    color: T.gold,
    fontSize: 12,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 36,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(160, 120, 64, 0.25)',
    ...Platform.select({
      web: { transition: 'background-color 0.2s ease', cursor: 'pointer' },
      default: {},
    }),
  },
  dotActive: {
    backgroundColor: T.gold,
  },
  ctaContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  ctaBtn: {
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderWidth: 1,
    borderColor: T.gold,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { transition: 'all 0.25s ease', cursor: 'pointer' },
      default: {},
    }),
  },
  ctaBtnHovered: {
    backgroundColor: T.gold,
  },
  ctaBtnText: {
    color: T.gold,
    fontSize: 11,
    fontFamily: T.sans,
    fontWeight: '600',
    letterSpacing: 3,
    ...Platform.select({
      web: { transition: 'color 0.25s ease' },
      default: {},
    }),
  },
  ctaBtnTextHovered: {
    color: '#FFFFFF',
  },
});
