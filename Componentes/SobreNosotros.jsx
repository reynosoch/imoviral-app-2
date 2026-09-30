import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Linking,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Footer from './Footer';

// ══ 📸 IMPORTACIÓN NATIVA DE TUS FOTONAS REALES ══
import imgJavier from '../assets/javier.jpg';       
import imgLuisa  from '../assets/luisa.png';       
import imgAngel  from '../assets/angel.jpg';       
import imgJamin  from '../assets/jamin.png';       
import imgCarlos from '../assets/carlos.png';      

/* ─────────────────────────────────────────────
   TOKENS DE DISEÑO PREMIUM
───────────────────────────────────────────── */
const T = {
  bg:        '#0A0A0A',
  bgAlt:     '#111110',
  gold:      '#A07840',
  goldHover: '#C39B5F',
  text:      '#F5F5F0',
  muted:     '#8A8A84',
  border:    'rgba(255,255,255,0.08)',
  borderMid: 'rgba(255,255,255,0.25)',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:  Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

/* ─────────────────────────────────────────────
   HOOK: Estado de hover compatible web/native
───────────────────────────────────────────── */
function useHover() {
  const [hovered, setHovered] = useState(false);
  const handlers = Platform.select({
    web: {
      onMouseEnter: () => setHovered(true),
      onMouseLeave: () => setHovered(false),
    },
    default: {},
  });
  return [hovered, handlers];
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTES DEL CONTENIDO
───────────────────────────────────────────── */
function Stat({ value, suffix, label }) {
  return (
    <View style={S.statItem}>
      <Text style={S.statVal}>
        {value}
        <Text style={S.statSuffix}>{suffix}</Text>
      </Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

function TeamCard({ name, role, img }) {
  const [isHovered, hoverHandlers] = useHover();
  return (
    <View { ...hoverHandlers } style={S.teamCard}>
      <View style={[S.teamPhotoWrap, isHovered && S.teamPhotoWrapHovered]}>
        <Image source={img} style={[S.teamPhoto, isHovered && S.teamPhotoHovered]} resizeMode="cover" />
      </View>
      <Text style={[S.teamName, isHovered && S.teamNameHovered]}>{name}</Text>
      <Text style={S.teamRole}>{role}</Text>
    </View>
  );
}

function ValorCard({ title, body, borderRight }) {
  const [isHovered, hoverHandlers] = useHover();
  return (
    <View { ...hoverHandlers } style={[S.valorCard, borderRight && S.valorCardBorder, isHovered && S.valorCardHovered]}>
      <Text style={[S.valorTitle, isHovered && S.valorTitleHovered]}>{title}</Text>
      <Text style={S.valorBody}>{body}</Text>
    </View>
  );
}

function Premio({ year, name, org, borderRight }) {
  const [isHovered, hoverHandlers] = useHover();
  return (
    <View { ...hoverHandlers } style={[S.premioCard, borderRight && S.premioCardBorder, isHovered && S.premioCardHovered]}>
      <Text style={S.premioYear}>{year}</Text>
      <Text style={[S.premioName, isHovered && S.premioNameHovered]}>{name}</Text>
      <Text style={S.premioOrg}>{org}</Text>
    </View>
  );
}

export default function SobreNosotros({ onIrServicios, onIrPropiedades, onNavigate, scrollToSection, onScroll }) {
  const { t, i18n } = useTranslation();
  const es = i18n.language.startsWith('es');
  const { width, height } = useWindowDimensions();

  const [introHovered, introHoverHandlers] = useHover();
  const [ctaTextHovered, ctaTextHoverHandlers] = useHover();

  const isWide   = width > 1024;
  const isMedium = width > 640;

  const scrollRef = useRef(null);
  const teamY = useRef(0);

  useEffect(() => {
    if (scrollToSection === 'equipo' && teamY.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: teamY.current + 180, animated: true });
      }, 300);
    }
  }, [scrollToSection]);

  const team = [
    { name: 'Javier Reynoso',  role: es ? 'Líder · INMOVIRAL' : 'Lead · INMOVIRAL', img: imgJavier },
    { name: 'Luisa Leyva',     role: es ? 'Diseñadora de Interfaz / UX' : 'UI / UX Designer', img: imgLuisa  },
    { name: 'Angel Contreras', role: es ? 'Co-Líder / Desarrollo' : 'Co-Lead / Development', img: imgAngel  },
    { name: 'Jamin Álvarez',   role: es ? 'Arquitectura de Datos' : 'Data Architecture', img: imgJamin  },
    { name: 'Carlos García',   role: es ? 'Recursos Humanos' : 'Human Resources', img: imgCarlos },
  ];

  const valores = [
    {
      title: es ? 'Discreción absoluta' : 'Absolute Discretion',
      body:  es ? 'Cada transacción es tratada con la más estricta confidencialidad. La privacidad de nuestros clientes es un principio innegociable.' : 'Every transaction is treated with the strictest confidentiality.',
    },
    {
      title: es ? 'Tiempo como activo' : 'Time as an Asset',
      body:  es ? 'Entendemos que tu tiempo es el recurso más escaso. Gestionamos cada proceso con precisión para minimizar fricciones.' : 'We manage every process with absolute precision.',
    },
    {
      title: es ? 'Resultados medibles' : 'Measurable Results',
      body:  es ? 'No prometemos lo que no podemos demostrar. Cada estrategia está respaldada por datos y un historial verificable.' : 'Every strategy is backed by data and a verifiable track record.',
    },
  ];

  const premios = [
    { y: '2023', n: es ? 'Mejor Agencia Inmobiliaria de Lujo' : 'Best Luxury Real Estate Agency', o: 'Forbes Real Estate Awards' },
    { y: '2022', n: es ? 'Top 10 Agencias Premium de México' : 'Top 10 Premium Agencies in Mexico', o: 'Expansión Inmobiliaria' },
    { y: '2021', n: es ? 'Excelencia en Servicio al Cliente' : 'Customer Service Excellence', o: 'National Luxury Real Estate' },
    { y: '2019', n: es ? 'Innovación en Marketing Inmobiliario' : 'Real Estate Marketing Innovation', o: 'Inmolatam Summit' },
  ];

  return (
    <ScrollView ref={scrollRef} style={S.root} contentContainerStyle={S.rootContent} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
      
      {/* HERO */}
      <View style={[S.hero, isWide && { flexDirection: 'row', alignItems: 'stretch', minHeight: height * 0.85 }]}>
        <View style={[S.heroContent, isWide && S.heroContentWide]}>
          <Text style={S.eyebrow}>{es ? 'Sobre Nosotros' : 'About Us'}</Text>
          <Text style={[S.heroTitle, isWide && S.heroTitleWide]}>
            {es ? 'Más de una\ndécada definiendo\nel ' : 'Over a decade\ndefining '}
            <Text style={S.em}>{es ? 'lujo inmobiliario' : 'luxury real estate'}</Text>
          </Text>
          <Text style={S.heroText}>
            {es
              ? 'INMOVIRAL nació de una convicción: que las propiedades excepcionales merecen una representación excepcional. Hoy somos la firma de referencia para quienes buscan lo mejor del mercado premium.'
              : 'INMOVIRAL was born out of a conviction: that exceptional properties deserve exceptional representation.'}
          </Text>
          <View style={S.statsRow}>
            <Stat value="12" suffix="+" label={es ? 'Años de trayectoria' : 'Years of Experience'} />
            <Stat value="150" suffix="+" label={es ? 'Propiedades vendidas' : 'Properties Sold'} />
            <Stat value="98" suffix="%" label={es ? 'Clientes satisfechos' : 'Satisfied Clients'} />
          </View>
        </View>

        <View style={[S.heroImageWrap, !isWide && S.heroImageWrapMobile]}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200' }} style={S.heroImage} resizeMode="cover" />
          <View style={S.heroImageOverlay} />
          <View style={S.heroTag}>
            <Text style={S.heroTagTitle}>{es ? 'Residencia Sierra Alta' : 'Sierra Alta Residence'}</Text>
            <Text style={S.heroTagSub}>Portfolio Exclusivo 2026</Text>
          </View>
        </View>
      </View>

      {/* SECCIÓN EL EQUIPO */}
      <View onLayout={(e) => { teamY.current = e.nativeEvent.layout.y; }} style={S.section}>
        <View style={S.sectionInner}>
          <View style={[S.equipoIntro, isWide && S.equipoIntroWide]}>
            <View style={{ flex: 1 }}>
              <Text style={S.sectionLabel}>{es ? 'El Equipo' : 'The Team'}</Text>
              <Text style={S.sectionTitle}>{es ? 'Personas que\nhacen la ' : 'People Who\nMake the '}<Text style={S.em}>{es ? 'diferencia' : 'Difference'}</Text></Text>
            </View>

            <View { ...introHoverHandlers } style={[S.introCardBox, introHovered && S.introCardBoxHovered]}>
              <Text style={[S.sectionBody, introHovered && S.sectionBodyHovered]}>
                {es ? 'Somos un equipo multidisciplinario con enfoque premium. Cada asesor gestiona un número limitado de propiedades para garantizar atención exclusiva.' : 'We are a limited number of clients to guarantee full attention.'}
              </Text>
            </View>
          </View>

          <View style={S.teamGrid}>
            {team.map((m, i) => (
              <View key={i} style={[S.teamCardWrap, { width: isWide ? '18.5%' : isMedium ? '45%' : '100%' }]}>
                <TeamCard {...m} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* VALORES */}
      <View style={[S.section, S.sectionAlt]}>
        <View style={S.sectionInner}>
          <Text style={S.sectionLabel}>{es ? 'Lo que nos guía' : 'Our Core Values'}</Text>
          <Text style={S.sectionTitle}>{es ? 'Nuestros ' : 'Our '}<Text style={S.em}>{es ? 'valores' : 'Values'}</Text></Text>
          <View style={[S.valoresGrid, isWide && S.valoresGridWide]}>
            {valores.map((v, i) => (
              <ValorCard key={i} title={v.title} body={v.body} borderRight={isWide && i < valores.length - 1} />
            ))}
          </View>
        </View>
      </View>

      {/* RECONOCIMIENTOS */}
      <View style={[S.section, S.sectionAlt, S.sectionTopBorder]}>
        <View style={S.sectionInner}>
          <View style={{ alignItems: 'center', marginBottom: 48 }}>
            <Text style={[S.sectionLabel, { textAlign: 'center' }]}>{es ? 'Reconocimientos' : 'Awards'}</Text>
            <Text style={[S.sectionTitle, { textAlign: 'center' }]}>{es ? 'Avalados por la ' : 'Backed by the '}<Text style={S.em}>{es ? 'industria' : 'Industry'}</Text></Text>
          </View>
          <View style={[S.premiosGrid, isWide && S.premiosGridWide]}>
            {premios.map((p, i) => (
              <Premio key={i} year={p.y} name={p.n} org={p.o} borderRight={isWide && i < premios.length - 1} />
            ))}
          </View>
        </View>
      </View>

      {/* CALL TO ACTION */}
      <View style={S.ctaSection}>
        <View { ...ctaTextHoverHandlers } style={{ alignItems: 'center' }}>
          <Text style={S.eyebrow}>{es ? 'Trabajemos Juntos' : 'Let\'s Work Together'}</Text>
          <Text style={[S.ctaTitle, { textAlign: 'center' }, ctaTextHovered && S.ctaTitleHovered]}>
            {es ? '¿Listo para una experiencia\nverdaderamente diferente?' : 'Ready for a\ntruly unique experience?'}
          </Text>
        </View>
        <View style={S.ctaBtns}>
          <Pressable onPress={onIrPropiedades} style={({ pressed }) => [S.btnGold, pressed && S.btnGoldPressed]}>
            <Text style={S.btnGoldText}>{es ? 'EXPLORAR PROPIEDADES' : 'Browse Properties'}</Text>
          </Pressable>
          <Pressable onPress={onIrServicios} style={({ pressed }) => [S.btnOutline, pressed && S.btnOutlinePressed]}>
            <Text style={S.btnOutlineText}>{es ? 'NUESTROS SERVICIOS' : 'Our Services'}</Text>
          </Pressable>
        </View>
      </View>

      {/* ─── FOOTER OFICIAL REUTILIZABLE ─── */}
      <Footer onNavigate={onNavigate} />

    </ScrollView>
  );
}

/* ─────────────────────────────────────────────
   HOJA DE ESTILOS DE ALTA GAMA SANEADA
───────────────────────────────────────────── */
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  rootContent: { paddingTop: 0 },
  hero: { flexDirection: 'column' },
  heroWide: { flexDirection: 'row', alignItems: 'stretch' },
  heroContent: { padding: 32, paddingTop: 100, justifyContent: 'center' },
  heroContentWide: { flex: 1, padding: 56, paddingTop: 100, paddingRight: 32 },
  eyebrow: { fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: T.gold, marginBottom: 24, fontFamily: T.sans },
  heroTitle: { fontFamily: T.serif, fontSize: 36, fontWeight: '300', color: T.text, marginBottom: 24 },
  heroTitleWide: { fontSize: 54, lineHeight: 64 },
  em: { fontStyle: 'italic', color: T.text },
  heroText: { fontSize: 13, lineHeight: 24, color: T.muted, maxWidth: 480, marginBottom: 40, fontFamily: T.sans },
  statsRow: { flexDirection: 'row', gap: 40, paddingTop: 32, borderTopWidth: 1, borderTopColor: T.border },
  statItem: { gap: 6 },
  statVal: { fontFamily: T.serif, fontSize: 40, color: T.text },
  statSuffix: { color: T.gold, fontSize: 32 },
  statLabel: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: T.muted, fontFamily: T.sans },
  
  heroImageWrap: { position: 'relative', flex: 1, minHeight: 450 },
  heroImageWrapMobile: { height: 300 },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroImageOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(10,10,10,0.30)',
    ...(Platform.OS === 'web' ? { backgroundImage: 'linear-gradient(to right, #0A0A0A 0%, transparent 30%)' } : {})
  },
  heroTag: { position: 'absolute', bottom: 40, right: 32, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', padding: 16, backgroundColor: 'rgba(10,10,10,0.75)' },
  heroTagTitle: { fontFamily: T.serif, fontSize: 17, color: T.text, marginBottom: 4 },
  heroTagSub: { fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: T.gold, fontFamily: T.sans },
  
  section: { paddingVertical: 80, paddingHorizontal: 32 },
  sectionAlt: { backgroundColor: T.bgAlt },
  sectionInner: { maxWidth: 1100, alignSelf: 'center', width: '100%' },
  sectionLabel: { fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: T.gold, fontFamily: T.sans, marginBottom: 12 },
  sectionTitle: { fontFamily: T.serif, fontSize: 40, fontWeight: '300', color: T.text, marginBottom: 16 },
  
  introCardBox: { flex: 1, padding: 24, borderWidth: 1, borderColor: T.border, backgroundColor: T.bgAlt },
  introCardBoxHovered: { borderColor: T.gold, backgroundColor: '#161614', ...Platform.select({ web: { boxShadow: '0px 15px 30px rgba(160,120,64,0.1)' } }) },
  sectionBody: { fontSize: 13, lineHeight: 24, color: T.muted, fontFamily: T.sans },
  sectionBodyHovered: { color: T.text },
  
  equipoIntro: { marginBottom: 56, gap: 40 },
  equipoIntroWide: { flexDirection: 'row', alignItems: 'center' },
  
  teamGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start', width: '100%', gap: 20 },
  teamCard: { width: '100%' },
  teamCardWrap: { marginBottom: 32, paddingHorizontal: 4 },
  teamPhotoWrap: { overflow: 'hidden', marginBottom: 16, width: '100%', backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  teamPhotoWrapHovered: { borderColor: T.gold, ...Platform.select({ web: { boxShadow: '0px 20px 40px rgba(0, 0, 0, 0.65)' } }) },
  teamPhoto: { width: '100%', height: 350, opacity: 0.85 },
  teamPhotoHovered: { transform: [{ scale: 1.05 }], opacity: 1 },
  teamName: { fontFamily: T.serif, fontSize: 19, color: T.text, marginBottom: 4 },
  teamNameHovered: { color: T.gold },
  teamRole: { fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: T.gold, fontFamily: T.sans },
  
  valoresGrid: { marginTop: 40, borderWidth: 1, borderColor: T.border, flexDirection: 'column' },
  valoresGridWide: { flexDirection: 'row' },
  valorCard: { flex: 1, padding: 40, borderBottomWidth: 1, borderBottomColor: T.border },
  valorCardHovered: { backgroundColor: '#1A1A18', ...Platform.select({ web: { boxShadow: 'inset 0 0 20px rgba(160,120,64,0.05)' } }) },
  valorCardBorder: { borderBottomWidth: 0 },
  valorTitle: { fontFamily: T.serif, fontSize: 26, color: T.text, marginBottom: 12 },
  valorTitleHovered: { color: T.gold, transform: [{ translateX: 4 }] },
  valorBody: { fontSize: 11, lineHeight: 20, color: T.muted, fontFamily: T.sans },
  
  premiosGrid: { borderWidth: 1, borderColor: T.border, flexDirection: 'column' },
  premiosGridWide: { flexDirection: 'row' },
  premioCard: { flex: 1, padding: 32, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: T.border },
  premioCardHovered: { backgroundColor: '#161614', borderBottomColor: T.gold, ...Platform.select({ web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.5)' } }) },
  premioCardBorder: { borderBottomWidth: 0 },
  premioYear: { fontSize: 9, letterSpacing: 2, color: T.gold, marginBottom: 10, fontFamily: T.sans },
  premioName: { fontFamily: T.serif, fontSize: 17, color: T.text, marginBottom: 6, textAlign: 'center' },
  premioNameHovered: { transform: [{ scale: 1.03 }] },
  premioOrg: { fontSize: 10, color: T.muted, fontFamily: T.sans, textAlign: 'center' },
  
  ctaSection: { paddingVertical: 100, paddingHorizontal: 32, alignItems: 'center' },
  ctaTitle: { fontFamily: T.serif, fontSize: 40, fontWeight: '300', color: T.text, marginBottom: 16, marginTop: 12 },
  ctaTitleHovered: { color: T.gold, transform: [{ scale: 1.02 }] },
  ctaBtns: { flexDirection: 'row', gap: 16, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' },
  btnGold: { height: 48, paddingHorizontal: 32, backgroundColor: T.gold, justifyContent: 'center', alignItems: 'center' },
  btnGoldPressed: { backgroundColor: T.goldHover },
  btnGoldText: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500', color: '#000', fontFamily: T.sans },
  btnOutline: { height: 48, paddingHorizontal: 32, backgroundColor: 'transparent', borderWidth: 1, borderColor: T.borderMid, justifyContent: 'center', alignItems: 'center' },
  btnOutlinePressed: { backgroundColor: 'rgba(255,255,255,0.05)' },
  btnOutlineText: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: T.text, fontFamily: T.sans },

  // ══ 💎 ESTILOS EXCLUSIVOS DEL FOOTER 4 COLUMNAS PREMIUM ══
  footerContainer: { paddingVertical: 80, paddingHorizontal: 60, backgroundColor: '#0F0D0A', borderTopWidth: 1, borderColor: 'rgba(160,120,64,0.2)' },
  footerGrid: { justifyContent: 'space-between', gap: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  footerColumnUnit: { gap: 14, marginBottom: 20 },
  footerLogoText: { fontFamily: T.serif, fontSize: 24, fontWeight: '400', color: '#FDFBF8', letterSpacing: 8, textTransform: 'uppercase', marginBottom: 10 },
  footerBrandDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 22, fontWeight: '300', fontFamily: T.sans },
  footerSocialContainer: { flexDirection: 'row', gap: 14, marginTop: 15 },
  
  socialIconSquare: { width: 36, height: 36, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  socialIconSquareHovered: { borderColor: '#A07840', backgroundColor: 'rgba(160,120,64,0.15)', transform: [{ scale: 1.15 }] },
  socialIconInnerText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '500', textTransform: 'uppercase' },
  socialIconInnerTextHovered: { color: '#A07840', fontWeight: '700' },
  
  footerColTitle: { fontFamily: T.serif, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontWeight: '400', textTransform: 'uppercase', marginBottom: 10 },
  footerLinkTouch: { paddingVertical: 2 },
  
  footerLinkItem: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '300', marginBottom: 4, fontFamily: T.sans },
  footerLinkItemHovered: { color: '#A07840', transform: [{ scale: 1.05 }] },
  
  footerInfoItem: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 22, fontWeight: '300', fontFamily: T.sans },
  footerBottomBar: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginTop: 40, paddingTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  footerCopyright: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: T.sans },
  footerBottomRightLinks: { flexDirection: 'row', gap: 24 },
  footerCopyrightLink: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: T.sans }
});