import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';

// ─────────────────────────────────────────────
// TOKENS DE DISEÑO (INMOVIRAL GLOBAL)
// ─────────────────────────────────────────────
const T = {
  gold:        '#A07840',
  goldLight:   '#C49A58',
  bgDark:      '#0C0C0C',
  textMain:    '#F2EDE5',
  textDim:     'rgba(242,237,229,0.55)',
  serif:       Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:        Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

// Hero images per tab
const HERO_IMAGES = {
  venta:    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1800&q=85',
  renta:    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1800&q=85',
  remates:  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1800&q=85',
};

const HERO_CONTENT = {
  venta: {
    eyebrow: 'COLECCIÓN EXCLUSIVA',
    title:   'Propiedades',
    italic:  'en Venta',
    sub:     'Residencias de lujo seleccionadas para quienes exigen lo mejor.',
  },
  renta: {
    eyebrow: 'COLECCIÓN EXCLUSIVA',
    title:   'Propiedades',
    italic:  'en Renta',
    sub:     'Espacios premium para vivir con distinción y confort.',
  },
  remates: {
    eyebrow: 'OPORTUNIDADES DE INVERSIÓN',
    title:   'Remates',
    italic:  'Bancarios',
    sub:     'Adquiere propiedades exclusivas mediante remates bancarios seleccionados.',
  },
};

// ─────────────────────────────────────────────
// TAB BUTTON
// ─────────────────────────────────────────────
function TabButton({ label, active, onPress }) {
  const [hovered, setHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        s.tabBtn,
        active && s.tabBtnActive,
        hovered && !active && s.tabBtnHovered,
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
        <Text style={[
          s.tabText,
          active && s.tabTextActive,
          hovered && !active && { color: T.goldLight },
        ]}>
          {label}
        </Text>
        {/* Gold underline indicator */}
        <View style={[
          s.tabUnderline,
          active && s.tabUnderlineActive,
        ]} />
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL: PropertyNavHeader
// Props:
//   activeTab: 'venta' | 'renta' | 'remates'
//   onChangeTab: (tab: string) => void
// ─────────────────────────────────────────────
export default function PropertyNavHeader({ activeTab = 'venta', onChangeTab }) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const hero = HERO_CONTENT[activeTab] || HERO_CONTENT.venta;
  const heroImg = HERO_IMAGES[activeTab] || HERO_IMAGES.venta;

  const tabs = [
    { key: 'venta',   label: 'PROPIEDADES EN VENTA' },
    { key: 'renta',   label: 'PROPIEDADES EN RENTA' },
    { key: 'remates', label: 'REMATES BANCARIOS' },
  ];

  return (
    <View style={s.wrapper}>
      {/* ── HERO IMAGE ── */}
      <View style={[s.heroFrame, isMobile && { height: 340 }]}>
        <Image
          source={{ uri: heroImg }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        {/* Gradient overlay – bottom heavy so text is readable */}
        <View style={s.heroOverlay} />
        <View style={s.heroOverlayTop} />

        {/* Hero Copy */}
        <View style={[s.heroBody, isMobile && { paddingHorizontal: 24, paddingBottom: 80 }]}>
          <Text style={s.heroEyebrow}>{hero.eyebrow}</Text>
          <Text style={[s.heroTitle, isMobile && { fontSize: 32, lineHeight: 42 }]}>
            {hero.title}{'\n'}
            <Text style={s.heroTitleItalic}>{hero.italic}</Text>
          </Text>
          <Text style={[s.heroSub, isMobile && { fontSize: 13 }]}>{hero.sub}</Text>
        </View>
      </View>

      {/* ── SUB-NAVBAR TABS ── */}
      <View style={[s.tabsBar, isMobile && s.tabsBarMobile]}>
        {/* Decorative left accent */}
        <View style={s.goldAccentLeft} />

        <View style={[s.tabsRow, isMobile && s.tabsRowMobile]}>
          {tabs.map(tab => (
            <TabButton
              key={tab.key}
              label={isMobile ? tab.label.replace('PROPIEDADES EN ', '').replace('REMATES BANCARIOS', 'REMATES') : tab.label}
              active={activeTab === tab.key}
              onPress={() => typeof onChangeTab === 'function' && onChangeTab(tab.key)}
            />
          ))}
        </View>

        {/* Decorative right accent */}
        <View style={s.goldAccentRight} />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────
// ESTILOS
// ─────────────────────────────────────────────
const s = StyleSheet.create({
  wrapper: {
    width: '100%',
  },

  // ── Hero ──
  heroFrame: {
    width: '100%',
    height: 440,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6,4,2,0.55)',
  },
  heroOverlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(6,4,2,0.4)',
  },
  heroBody: {
    paddingHorizontal: 48,
    paddingBottom: 64,
    zIndex: 2,
  },
  heroEyebrow: {
    color: T.gold,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 4,
    fontFamily: T.sans,
    marginBottom: 12,
  },
  heroTitle: {
    color: T.textMain,
    fontSize: 48,
    lineHeight: 60,
    fontFamily: T.serif,
    fontWeight: '300',
    marginBottom: 14,
  },
  heroTitleItalic: {
    fontStyle: 'italic',
    color: T.gold,
  },
  heroSub: {
    color: T.textDim,
    fontSize: 14,
    fontFamily: T.sans,
    maxWidth: 480,
    lineHeight: 22,
    letterSpacing: 0.3,
  },

  // ── Sub-navbar Tabs Bar ──
  tabsBar: {
    backgroundColor: T.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(160,120,64,0.18)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 56,
    ...Platform.select({
      web: { position: 'sticky', top: 0, zIndex: 90 },
      default: {},
    }),
  },
  tabsBarMobile: {
    paddingHorizontal: 8,
    minHeight: 50,
  },
  goldAccentLeft: {
    width: 2,
    height: 20,
    backgroundColor: T.gold,
    marginRight: 16,
    opacity: 0.5,
  },
  goldAccentRight: {
    width: 2,
    height: 20,
    backgroundColor: T.gold,
    marginLeft: 16,
    opacity: 0.5,
    ...Platform.select({ web: { marginLeft: 'auto' }, default: {} }),
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
    flex: 1,
  },
  tabsRowMobile: {
    justifyContent: 'space-around',
  },

  // ── Tab Buttons ──
  tabBtn: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    position: 'relative',
  },
  tabBtnActive: {
    // no bg change – underline handles it
  },
  tabBtnHovered: {
    backgroundColor: 'rgba(160,120,64,0.06)',
  },
  tabText: {
    color: 'rgba(242,237,229,0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    fontFamily: T.sans,
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: T.textMain,
  },
  tabUnderline: {
    height: 2,
    width: 0,
    backgroundColor: T.gold,
    marginTop: 6,
    borderRadius: 1,
  },
  tabUnderlineActive: {
    width: '100%',
  },
});
