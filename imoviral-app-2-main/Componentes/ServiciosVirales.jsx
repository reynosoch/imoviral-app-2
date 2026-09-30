import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Image,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import Footer from './Footer';
import { upsertUser, submitRequest } from './systemSync';

const C = {
  bg:         '#0F0D0A',
  card:       '#141210',
  surface:    '#1A1714',
  gold:       '#A07840',
  goldDeep:   '#C49A58',
  text:       '#F2EDE5',
  textSub:    '#7A6E62',
  textDim:    'rgba(242,237,229,0.40)',
  border:     'rgba(160,120,64,0.12)',
  borderSoft: 'rgba(255,255,255,0.07)',
  green:      'rgba(37,211,102,0.85)',
  greenBg:    'rgba(37,211,102,0.10)',
  greenBdr:   'rgba(37,211,102,0.30)',
  serif:      Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:       Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1800&q=80';
const GUARANTEE_IMAGE = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=80';

const CONTACT_PHONE = '+526181630471';
const CONTACT_WA    = 'https://wa.me/526181630471';
const CONTACT_EMAIL = 'info@inmoviral.com';

// Configuración de Mercado Pago para la suscripción
const MERCADO_PAGO_CONFIG = {
  // NOTA: Para producción, este token debe almacenarse en un backend seguro (ej. Supabase Edge Functions).
  // Colocamos aquí esta constante para que puedas cambiarla fácilmente por tu token real (empieza con APP_USR- o TEST-).
  ACCESS_TOKEN: 'TEST-3392305847385981-071419-74d1bf4d177f1544a49db21cd9021481-1901178652', 
  USE_SANDBOX: true, // true para pruebas (Sandbox), false para producción
};

// 📷 REPOSITORIO MULTIMEDIA DE ALTA GAMA PARA LOS 5 SERVICIOS CORE
const GALERIAS_SERVICIOS = {
  mudanza: [
    'https://images.unsplash.com/photo-1527453303844-40fae2828e4f?w=800&q=80',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&q=80'
  ],
  socials: [
    'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&q=80',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80'
  ],
  studio: [
    'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
    'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80'
  ],
  advisory: [
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=800&q=80'
  ],
  limpieza: [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80', // Detallado de cocina de lujo
    'https://images.unsplash.com/photo-1528740561666-42477927365f?w=800&q=80', // Sanitización e interiores pulcro
    'https://images.unsplash.com/photo-1603712449591-2f7e1216c59a?w=800&q=80'  // Sala reluciente de revista
  ]
};

// ─────────────────────────────────────────────
// COMPONENTES DE SOPORTE E INTERACCIÓN NATIVA
// ─────────────────────────────────────────────

function FooterLink({ label, onPress, customStyle }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={{ alignSelf: 'flex-start' }}
    >
      <Text style={[styles.footerLinkText, customStyle, hovered && { color: C.gold, transform: [{ translateX: 4 }] }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SocialBadge({ net }) {
  const [hovered, setHovered] = useState(false);

  const handlePress = async () => {
    let url = '';
    if (net === 'IG') {
      url = 'https://www.instagram.com/inmoviralbis?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
    } else if (net === 'WH') {
      url = 'https://wa.me/526181630471';
    } else if (net === 'GM') {
      url = 'mailto:ventas@inmoviral.com.mx';
    } else if (net === 'FB') {
      url = 'https://www.facebook.com';
    }

    if (url) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(url);
        }
      } catch (err) {
        console.error("Error al abrir URL:", err);
      }
    }
  };

  const getIconName = () => {
    if (net === 'IG') return 'instagram';
    if (net === 'WH') return 'whatsapp';
    if (net === 'FB') return 'facebook';
    if (net === 'GM') return 'envelope';
    return 'circle';
  };

  const activeColor = hovered ? C.gold : 'rgba(255,255,255,0.4)';

  return (
    <Pressable
      onPress={handlePress}
      onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
      style={[styles.footerSocialBtn, hovered && { borderColor: C.gold, backgroundColor: 'rgba(160,120,64,0.05)', transform: [{ scale: 1.08 }] }]}
    >
      <FontAwesome name={getIconName()} size={14} color={activeColor} />
    </Pressable>
  );
}

function ServiceCard({ item, isOpen, onToggle, onMail, onWa, isLarge }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);
  const hoverAnim = useRef(new Animated.Value(0)).current;

  // Animación suave de apertura del panel
  const [showPanel, setShowPanel] = useState(isOpen);
  const openAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;

  useEffect(() => {
    if (isOpen) {
      setShowPanel(true);
      Animated.timing(openAnim, { toValue: 1, duration: 400, useNativeDriver: false }).start();
    } else {
      Animated.timing(openAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start(() => {
        setShowPanel(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: hovered ? 1 : 0,
      duration: 350,
      useNativeDriver: false
    }).start();
  }, [hovered]);

  const bgTint = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['transparent', 'rgba(160,120,64,0.06)'] });
  const titleColor = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['#F2EDE5', '#A07840'] }); 
  const numColor = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(160,120,64,0.12)', 'rgba(160,120,64,0.4)'] });
  const linkColor = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [C.gold, C.goldDeep] });
  const lineWidth = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 28] });

  return (
    <Animated.View style={{ width: '100%', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: bgTint }}>
      <Pressable
        onPress={onToggle}
        onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
        style={{ flexDirection: isLarge ? 'row' : 'column', width: '100%', alignItems: 'flex-start', paddingVertical: isLarge ? 48 : 32, paddingHorizontal: 16 }}
      >
        {/* Número y Título */}
        <View style={{ width: isLarge ? '35%' : '100%', paddingRight: isLarge ? 40 : 0, marginBottom: isLarge ? 0 : 24 }}>
          <Animated.Text style={[styles.serviceNum, { fontSize: 42, lineHeight: 42, marginBottom: 12, color: numColor }]}>{item.num}</Animated.Text>
          <Text style={styles.serviceTag}>{t(item.tagKey, { defaultValue: item.tag })}</Text>
          <Animated.Text style={[styles.serviceTitle, { fontSize: 24, lineHeight: 30, color: titleColor }]}>
            {t(item.titleKey, { defaultValue: item.titulo })}{'\n'}
            <Animated.Text style={[styles.serviceTitleEm, { color: titleColor }]}>{t(item.emKey, { defaultValue: item.tituloEm })}</Animated.Text>
          </Animated.Text>
        </View>

        {/* Descripción */}
        <View style={{ width: isLarge ? '35%' : '100%', paddingRight: isLarge ? 40 : 0, marginBottom: isLarge ? 0 : 24 }}>
          <Text style={[styles.serviceDesc, { fontSize: 13, lineHeight: 22 }]}>{t(item.descKey, { defaultValue: item.desc })}</Text>
        </View>

        {/* Features & CTA */}
        <View style={{ width: isLarge ? '30%' : '100%' }}>
          <View style={styles.featuresList}>
            {item.features.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Animated.View style={[styles.featureLine, { width: lineWidth }, hovered && { backgroundColor: C.goldDeep }]} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.serviceLink, { borderTopWidth: 0, marginTop: 16, paddingTop: 0, flexDirection: 'row', alignItems: 'center' }]}>
            <Animated.Text style={[styles.serviceLinkText, { color: linkColor }]}>
              {t(item.ctaKey, { defaultValue: item.cta })}
            </Animated.Text>
            <Animated.Text style={[styles.serviceLinkText, { marginLeft: 8, color: linkColor }]}>
              →
            </Animated.Text>
          </View>
        </View>
      </Pressable>

      <Animated.View style={{ position: 'absolute', right: 16, top: isLarge ? 48 : 32, transform: [{ rotate: openAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}>
        <FontAwesome5 name="chevron-down" size={16} color={C.gold} />
      </Animated.View>

      {showPanel && (
        <Animated.View style={[styles.contactPanel, { 
          marginTop: 32, backgroundColor: 'rgba(255,255,255,0.02)', padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
          opacity: openAnim,
          transform: [{ translateY: openAnim.interpolate({ inputRange: [0, 1], outputRange: [-15, 0] }) }]
        }]}>
          <Text style={styles.contactLabel}>{t('sv_panel_call', { defaultValue: 'Un asesor exclusivo se pondrá en contacto a la brevedad.' })}</Text>
          <View style={styles.contactRow}>
            <Pressable onPress={onMail} style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.7 }, { flexDirection: 'row', alignItems: 'center' }]}>
              <FontAwesome5 name="envelope" size={12} color={C.gold} style={{ marginRight: 8 }} />
              <Text style={styles.contactBtnText}>{t('footer.contact_t', { defaultValue: 'Mandar Correo' })}</Text>
            </Pressable>
            <Pressable onPress={onWa} style={({ pressed }) => [styles.contactBtn, styles.contactBtnWa, pressed && { opacity: 0.7 }, { flexDirection: 'row', alignItems: 'center' }]}>
              <FontAwesome5 name="whatsapp" size={14} color={C.gold} style={{ marginRight: 8 }} />
              <Text style={[styles.contactBtnText, styles.contactBtnTextWa]}>WhatsApp</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function PlanCard({ plan, onPress, cardWidth, onCancelPress }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  return (
    <View style={{ width: cardWidth, padding: 12 }}>
      <Pressable
        onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
        style={[styles.planCard, plan.featured && styles.planCardFeatured, hovered && styles.planCardHovered]}
      >
        {plan.featured && (
          <View style={styles.planBadge}>
            <Text style={styles.planBadgeText}>{t('sv_popular', { defaultValue: 'MÁS POPULAR' })}</Text>
          </View>
        )}
        <Text style={styles.planLabel}>{plan.label}</Text>
        <Text style={styles.planTitulo}>{plan.titulo}</Text>
        <View style={styles.planDivider} />
        <Text style={styles.planPrecio}>{plan.precio}</Text>

        <View style={styles.planFeatures}>
          {plan.features.map((f, i) => (
            <View key={i} style={styles.planFeatureRow}>
              <Text style={styles.planFeatureCheck}>✓</Text>
              <Text style={styles.planFeatureText}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={plan.disabled ? null : onPress}
          disabled={plan.disabled}
          style={[
            styles.planBtn,
            plan.featured && !plan.disabled && styles.planBtnFeatured,
            hovered && !plan.featured && !plan.disabled && { backgroundColor: 'rgba(160,120,64,0.1)', borderColor: C.gold },
            plan.disabled && { backgroundColor: 'transparent', borderColor: 'rgba(160,120,64,0.3)' }
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            {plan.disabled && <FontAwesome5 name="crown" size={10} color={C.gold} style={{ marginRight: 8 }} />}
            <Text style={[
              styles.planBtnText,
              plan.featured && !plan.disabled && styles.planBtnTextFeatured,
              hovered && !plan.featured && !plan.disabled && { color: C.gold },
              plan.disabled && { color: C.gold }
            ]}>
              {plan.cta}
            </Text>
          </View>
        </Pressable>

        {plan.disabled && (
          <Pressable
            onPress={onCancelPress}
            style={styles.cancelPlanBtn}
          >
            <Text style={styles.cancelPlanBtnText}>
              {t('sv_cancel_sub', { defaultValue: 'CANCELAR SUSCRIPCIÓN' })}
            </Text>
          </Pressable>
        )}
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL INTEGRADO
// ─────────────────────────────────────────────
export default function ServiciosVirales({ onIrLogin, onVolver, onNavigate, user, onScroll, isUserPlus }) {
  const { t, i18n }    = useTranslation();
  const idiomaActual   = i18n.language || 'es';
  const { width }      = useWindowDimensions();
  const es             = idiomaActual.startsWith('es');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const carouselFade = useRef(new Animated.Value(1)).current;

  const [cardsActivas, setCardsActivas] = useState({});
  const [hoveredBack, setHoveredBack] = useState(false);
  const [hoveredAboutImg, setHoveredAboutImg] = useState(false);
  const isLarge = width > 900;
  
  const [servicioActivoTab, setServicioActivoTab] = useState('mudanza');
  const [imagenActivaIdx, setImagenActivaIdx] = useState(0);

  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [purchaseStatus, setPurchaseStatus] = useState(null); // 'success' | 'loading' | 'card_form' | null
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const planWidth = '100%'; // Full width or single card display



  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [fadeAnim]);

  // Motor de transición fluida automática de 2 segundos (Smooth Cross-Fade)
  useEffect(() => {
    const interval = setInterval(() => {
      const fotos = GALERIAS_SERVICIOS[servicioActivoTab];
      const nextIdx = (imagenActivaIdx + 1) % fotos.length;
      
      Animated.timing(carouselFade, { toValue: 0, duration: 250, useNativeDriver: Platform.OS !== 'web' }).start(() => {
        setImagenActivaIdx(nextIdx);
        Animated.timing(carouselFade, { toValue: 1, duration: 350, useNativeDriver: Platform.OS !== 'web' }).start();
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [servicioActivoTab, imagenActivaIdx, carouselFade]);

  const animarCambioTab = (tabId) => {
    Animated.timing(carouselFade, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() => {
      setServicioActivoTab(tabId);
      setImagenActivaIdx(0);
      Animated.timing(carouselFade, { toValue: 1, duration: 300, useNativeDriver: Platform.OS !== 'web' }).start();
    });
  };

  const abrirUrl = (url) => Linking.openURL(url).catch(() => {});
  const mandarCorreoOficial = () => abrirUrl(`mailto:${CONTACT_EMAIL}?subject=Consulta%20InmoViral%20Premium`);

  const handlePlanPress = () => {
    if (!user) {
      alert(es ? 'Inicia sesión para poder adquirir la suscripción InmoViral Plus.' : 'Please log in to purchase the InmoViral Plus subscription.');
      onIrLogin && onIrLogin();
      return;
    }
    setShowPurchaseConfirm(true);
  };

  const handleCardNumberChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean.length >= 2) {
      setCardExpiry(`${clean.slice(0, 2)}/${clean.slice(2, 4)}`);
    } else {
      setCardExpiry(clean);
    }
  };

  const handleCvvChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    setCardCvv(clean.substring(0, 4));
  };

  const executePurchase = async () => {
    // Abrimos el formulario de tarjeta en el modal de la app
    setPurchaseStatus('card_form');
  };

  const handleCardSubmit = async () => {
    // Validar inputs de tarjeta
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 16) {
      alert(es ? 'Introduce un número de tarjeta válido (16 dígitos).' : 'Please enter a valid card number (16 digits).');
      return;
    }
    if (!cardExpiry || !cardExpiry.includes('/') || cardExpiry.length < 5) {
      alert(es ? 'Introduce una fecha de vencimiento válida (MM/AA).' : 'Please enter a valid expiration date (MM/YY).');
      return;
    }
    if (!cardCvv || cardCvv.length < 3) {
      alert(es ? 'Introduce un CVV de 3 o 4 dígitos.' : 'Please enter a valid 3 or 4-digit CVV.');
      return;
    }
    if (!cardName || cardName.trim().length < 3) {
      alert(es ? 'Introduce el nombre completo del titular de la tarjeta.' : 'Please enter the cardholder full name.');
      return;
    }

    setPurchaseStatus('loading');
    
    // Simulación del procesamiento de cobro por 2.5 segundos
    setTimeout(async () => {
      try {
        const record = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          phone: user.user_metadata?.phone || '',
          avatar_url: user.user_metadata?.avatar_url || '',
          inmoviralPlus: true,
          updated_at: new Date().toISOString()
        };
        await upsertUser(record);

        await submitRequest({
          id: 'req-' + Date.now(),
          action: 'inmoviral_plus_purchase',
          targetId: user.id,
          targetName: user.user_metadata?.full_name || user.email || 'Usuario',
          message: `El usuario adquirió la suscripción InmoViral Plus ($150/mes) - Cobro Simulado por Tarjeta de ${cardName}`,
          status: 'pending'
        });

        try {
          await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              service_id: 'service_tr9ith7',
              template_id: 'template_48abx8o',
              user_id: 'Ytr-HW5hBxuiLfPTy',
              template_params: {
                to_email: 'ventas@inmoviral.com.mx',
                email: 'ventas@inmoviral.com.mx',
                correo: user.email,
                correo_destinatario: 'ventas@inmoviral.com.mx',
                admin_email: 'ventas@inmoviral.com.mx',
                from_name: user.user_metadata?.full_name || user.email,
                reply_to: user.email,
                titulo: 'Suscripción InmoViral Plus (Simulada)',
                tipo: 'Suscripción',
                operacion: 'Mensual',
                precio: '$150 MXN',
                ubicacion: 'N/A',
                descripcion: `El usuario ha comprado la suscripción mensual de InmoViral Plus por $150 pesos (Cobro Simulado por Tarjeta). Titular: ${cardName}.`,
                nombre_contacto: user.user_metadata?.full_name || 'N/A',
                telefono_contacto: user.user_metadata?.phone || 'N/A',
                correo_contacto: user.email,
                message: `El usuario ${user.email} ha adquirido la suscripción InmoViral Plus ($150 MXN/mes).`
              }
            })
          });
        } catch (err) {
          console.warn("EmailJS error:", err);
        }

        setPurchaseStatus('success');
      } catch (err) {
        console.error("Simulation error:", err);
        alert(es ? 'Ocurrió un error al procesar tu pago. Por favor, intenta de nuevo.' : 'An error occurred processing your payment. Please try again.');
        setPurchaseStatus('card_form');
      }
    }, 2500);
  };

  const handleCancelPress = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(es ? '¿Estás seguro de que deseas cancelar tu suscripción InmoViral Plus?' : 'Are you sure you want to cancel your InmoViral Plus subscription?')
      : true;

    if (!confirmed) return;

    try {
      setPurchaseStatus('loading');
      
      const record = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || '',
        inmoviralPlus: false,
        updated_at: new Date().toISOString()
      };
      await upsertUser(record);

      await submitRequest({
        id: 'req-' + Date.now(),
        action: 'inmoviral_plus_cancel',
        targetId: user.id,
        targetName: user.user_metadata?.full_name || user.email || 'Usuario',
        message: `El usuario canceló su suscripción InmoViral Plus`,
        status: 'pending'
      });

      alert(es ? 'Tu suscripción ha sido cancelada correctamente.' : 'Your subscription has been canceled successfully.');
      setPurchaseStatus(null);

      // Recargar para sincronizar el estado global en App.js
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        onNavigate && onNavigate('home');
        setTimeout(() => onNavigate && onNavigate('servicios'), 100);
      }
    } catch (e) {
      console.error(e);
      alert(es ? 'Ocurrió un error al cancelar tu suscripción. Por favor, intenta de nuevo.' : 'An error occurred canceling your subscription. Please try again.');
      setPurchaseStatus(null);
    }
  };

  // ESTRUCTURA CON LOS 5 SERVICIOS CORE OFICIALES
  const serviciosData = [
    { id: 1, num: '01', tag: 'Logística', tagKey: 'sv_s1_tag', titulo: 'Ayuda con la', titleKey: 'sv_s1_t', tituloEm: 'Mudanza', emKey: 'sv_s1_em', desc: 'Coordinamos cada detalle de tu traslado con empresas certificadas. Desde el embalaje profesional hasta la instalación en tu nuevo hogar.', descKey: 'sv_s1_desc', features: ['Embalaje profesional', 'Transporte asegurado', 'Coordinación total', 'Seguro de bienes incluido'], cta: 'Solicitar Servicio', ctaKey: 'sv_cta_req' },
    { id: 2, num: '02', tag: 'Marketing Digital', tagKey: 'sv_s2_tag', titulo: 'Exposición en', titleKey: 'sv_s2_t', tituloEm: 'Redes Sociales', emKey: 'sv_s2_em', desc: 'Posicionamos tu propiedad frente a miles de compradores e inversionistas activos mediante campañas segmentadas de alto impacto.', descKey: 'sv_s2_desc', features: ['Campañas pagadas', 'Contenido editorial', 'Audiencias de alto valor', 'Reportes de rendimiento'], cta: 'Solicitar Servicio', ctaKey: 'sv_cta_req' },
    { id: 3, num: '03', tag: 'Visual Premium', tagKey: 'sv_s3_tag', titulo: 'Fotografía', titleKey: 'sv_s3_t', tituloEm: 'Profesional', emKey: 'sv_s3_em', desc: 'Capturamos la esencia y el valor de cada propiedad con equipo de alto rendimiento, tours virtuales 360 y video en 4K.', descKey: 'sv_s3_desc', features: ['Fotografía de interiores', 'Video cinematic 4K', 'Tour virtual 360°', 'Entrega en 48 horas'], cta: 'Solicitar Servicio', ctaKey: 'sv_cta_req' },
    { id: 4, num: '04', tag: 'Consultoría', tagKey: 'sv_s4_tag', titulo: 'Asesoramiento', titleKey: 'sv_s4_t', tituloEm: 'Agente INMOVIRAL', emKey: 'sv_s4_em', desc: 'Un experto dedicado a tu operación de principio a fin. Negociación estratégica y acompañamiento legal certificado.', descKey: 'sv_s4_desc', features: ['Agente senior dedicado', 'Análisis de mercado', 'Due diligence legal', 'Soporte de cierre'], cta: 'Agendar Consulta', ctaKey: 'sv_cta_schedule' },
    { id: 5, num: '05', tag: 'Preparación Estética', tagKey: 'sv_s5_tag', titulo: 'Limpieza Profunda', titleKey: 'sv_s5_t', tituloEm: 'Antes de la Visita', emKey: 'sv_s5_em', desc: 'Dejamos tu inmueble en condiciones idénticas a un hotel de 5 estrellas. Una presentación pulcra maximiza el valor percibido por los sinodales e inversionistas.', descKey: 'sv_s5_desc', features: ['Detallado pre-fotografía', 'Sanitización de alta gama', 'Pulido de superficies finas', 'Aromatización ambiental VIP'], cta: 'Solicitar Limpieza', ctaKey: 'sv_cta_clean' }
  ];

  // Único plan oficial de InmoViral Plus
  const planesData = [
    { 
      label: 'INMOVIRAL PLUS', 
      titulo: es ? 'Suscripción Premium' : 'Premium Subscription', 
      precio: '$150 MXN / ' + (es ? 'Mensual' : 'Monthly'), 
      features: es ? [
        'Aparición destacada garantizada en la sección de "Propiedades Destacadas" de la pantalla de inicio.',
        'Marcador destacado con corona de lujo en el Mapa Interactivo de ubicaciones exclusivas.',
        'Soporte directo prioritario para la actualización y edición de tu publicación.',
        'Máxima exposición comercial ante inversionistas y compradores de alto nivel.'
      ] : [
        'Guaranteed appearance in the "Featured Properties" homepage section.',
        'Highlighted luxury marker on the Interactive Locations Map.',
        'Direct priority support to update pictures and descriptions.',
        'Maximum commercial exposure for VIP buyers & investors.'
      ],
      featured: true, 
      cta: isUserPlus ? (es ? 'SUSCRIPCIÓN ACTIVA' : 'ACTIVE SUBSCRIPTION') : (es ? 'Adquirir InmoViral Plus' : 'Get InmoViral Plus'),
      disabled: isUserPlus
    }
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
        
        {/* ════ HERO ════ */}
        <Animated.View style={[styles.hero, { opacity: fadeAnim }]}>
          <Image source={{ uri: HERO_IMAGE }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={styles.eyebrowRow}>
              <View style={styles.eyebrowLine} />
              <Text style={styles.eyebrow}>{t('sv_eyebrow', { defaultValue: 'LO QUE OFRECEMOS' })}</Text>
            </View>
            <Text style={styles.heroTitle}>
              {t('sv_hero_t1', { defaultValue: 'Servicios diseñados' })}{'\n'}
              {t('sv_hero_t2', { defaultValue: 'para ' })}
              <Text style={styles.heroEmphasis}>{t('sv_hero_em', { defaultValue: 'resultados' })}</Text>{'\n'}
              {t('sv_hero_t3', { defaultValue: 'extraordinarios' })}
            </Text>
            <Text style={styles.heroSub}>
              {t('sv_hero_sub', { defaultValue: 'Cada servicio ha sido concebido para acompañar a compradores, vendedores e inversionistas desde la primera consulta hasta mucho después del cierre.' })}
            </Text>
          </View>
        </Animated.View>

        {/* ════ PAQUETES HÍBRIDOS CON LABIA COMERCIAL AVANZADA (INMOVIRAL PLUS MERO ARRIBA) ════ */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={styles.sectionLabel}>{t('sv_planes_label', { defaultValue: 'PLANES DE SERVICIO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_planes_t1', { defaultValue: 'Suscripción ' })}
            <Text style={styles.sectionEmphasis}>InmoViral Plus</Text>
          </Text>

          <View style={styles.flexGridWrapper}>
            {planesData.map((plan, idx) => (
              <PlanCard key={idx} plan={plan} cardWidth={planWidth} onPress={handlePlanPress} onCancelPress={handleCancelPress} />
            ))}
          </View>
        </View>

        {/* ════ PORTAFOLIO DE 5 SERVICIOS CORE CON LISTA ACORDEÓN ELEGANTE ════ */}
        <View style={[styles.section, { maxWidth: 1200 }]}>
          <Text style={styles.sectionLabel}>{t('sv_services_label', { defaultValue: 'PORTAFOLIO DE SERVICIOS' })}</Text>
          <Text style={[styles.sectionTitle, { marginBottom: 60 }]}>
            {t('sv_services_t1', { defaultValue: 'Servicios exclusivos para' })}{'\n'}
            {t('sv_services_t2', { defaultValue: 'resultados ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_services_em', { defaultValue: 'extraordinarios' })}</Text>
          </Text>

          <View style={{ flexDirection: 'column', width: '100%' }}>
            {serviciosData.map((item, idx) => (
              <ServiceCard
                key={item.id}
                item={item}
                isOpen={!!cardsActivas[item.id]}
                onToggle={() => setCardsActivas(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                onMail={mandarCorreoOficial}
                onWa={() => abrirUrl(CONTACT_WA)}
                isLarge={isLarge}
              />
            ))}
          </View>
        </View>

        {/* ════ COMPROMISO / GARANTÍAS MINIMALISTAS EDITORIALES ════ */}
        <View style={[styles.section, styles.sectionDark]}>
          <Text style={styles.sectionLabel}>{t('sv_garantias_label', { defaultValue: 'NUESTRO COMPROMISO' })}</Text>
          <Text style={styles.sectionTitle}>
            {t('sv_garantias_t1', { defaultValue: 'Garantías que nos ' })}
            <Text style={styles.sectionEmphasis}>{t('sv_garantias_em', { defaultValue: 'distinguen' })}</Text>
          </Text>

          <View style={[styles.garantiasWrap, { flexDirection: width > 900 ? 'row' : 'column' }]}>
            <Pressable 
              onHoverIn={() => Platform.OS === 'web' && setHoveredAboutImg(true)}
              onHoverOut={() => Platform.OS === 'web' && setHoveredAboutImg(false)}
              style={[styles.garantiaImageWrap, { flex: width > 900 ? 1 : 'none' }]}
            >
              <Image 
                source={{ uri: GUARANTEE_IMAGE }} 
                style={[styles.garantiaImage, hoveredAboutImg && { transform: [{ scale: 1.05 }] }]} 
                resizeMode="cover" 
              />
              <View style={styles.garantiaImageOverlay} />
              <Text style={styles.garantiaImageLabel}>"Exclusividad y orden que definen un nuevo estándar patrimonial."</Text>
            </Pressable>

            <View style={[styles.garantiasList, { flex: width > 900 ? 1.2 : 'none' }]}>
              {[
                { title: 'SOPORTE POST-VENTA ININTERRUMPIDO', subtitle: 'POST-VENTA DELUXE · PREMIUM PARTNER', desc: 'Una vez completado el cierre de la transacción, seguimos a tu disposición absoluta. Te brindamos asesoría continua en temas legales, técnicos y corporativos de por vida.' },
                { title: 'CONSULTORÍA PRIVADA EXCLUSIVA', subtitle: 'PRIVATE ADVISORY · VIP MEMBER', desc: 'Ponemos a tu disposición un asesor de élite senior de forma completamente dedicada. Olvídate de los call centers; aquí tu patrimonio lo maneja un experto.' },
                { title: 'ESTRATEGIA CORPORATIVA ALINEADA', subtitle: 'ENGINEERING OF EXCELLENCE · CORPORATE STANDARD', desc: 'Nuestra estructura de honorarios está diseñada para que ganemos únicamente cuando tú ganes. Transparencia total enfocada en maximizar tu retorno de inversión.' }
              ].map((g, i) => (
                <View key={i} style={styles.garantiaMinimalItem}>
                  <Text style={styles.garantiaMinimalTitle}>{g.title}</Text>
                  <Text style={styles.garantiaMinimalSubtitle}>{g.subtitle}</Text>
                  <Text style={styles.garantiaMinimalDesc}>{g.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ════ VIRAL MEDIA MULTIPESTAÑA CON LOS 5 SERVICIOS CORE Y AUTOMOVIMIENTO ════ */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>VIRAL MEDIA</Text>
          <Text style={styles.sectionTitle}>Galería Multimedia Studio</Text>
          
          <View style={styles.mudanzaCarouselContainer}>
            <View style={styles.mudanzaHeaderRow}>
              {[
                { id: 'mudanza', label: '🚚 Ayuda con la Mudanza' },
                { id: 'socials', label: '📱 Exposición en Redes Sociales' },
                { id: 'studio', label: '📷 Fotografía Profesional' },
                { id: 'advisory', label: '💼 Asesoramiento Agente INMOVIRAL' },
                { id: 'limpieza', label: '✨ Limpieza Profunda Pre-Visita' }
              ].map(tab => (
                <Pressable 
                  key={tab.id} 
                  onPress={() => { setServicioActivoTab(tab.id); setImagenActivaIdx(0); }} 
                  style={[styles.tabSelectorBtn, servicioActivoTab === tab.id && styles.tabSelectorBtnActive]}
                >
                  <Text style={[styles.mudanzaBtnText, servicioActivoTab === tab.id && { color: C.bg }]}>{tab.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Contenedor del Carrusel con Opacidad Animada Continuamente */}
            <Animated.View style={[styles.carouselViewerBox, { opacity: carouselFade }]}>
              <Image source={{ uri: GALERIAS_SERVICIOS[servicioActivoTab][imagenActivaIdx] }} style={styles.carouselImageEngine} resizeMode="cover" />
              <View style={styles.carouselArrowContainer}>
                <Pressable 
                  style={styles.carouselArrowBtn} 
                  onPress={() => {
                    const fotos = GALERIAS_SERVICIOS[servicioActivoTab];
                    const prevIdx = (imagenActivaIdx === 0) ? fotos.length - 1 : imagenActivaIdx - 1;
                    setImagenActivaIdx(prevIdx);
                  }}
                >
                  <Text style={styles.carouselArrowText}>◀</Text>
                </Pressable>
                
                <View style={styles.carouselIndicatorsRow}>
                  {GALERIAS_SERVICIOS[servicioActivoTab].map((_, idx) => (
                    <View key={idx} style={[styles.indicatorDot, imagenActivaIdx === idx && styles.indicatorDotActive]} />
                  ))}
                </View>

                <Pressable 
                  style={styles.carouselArrowBtn} 
                  onPress={() => {
                    const fotos = GALERIAS_SERVICIOS[servicioActivoTab];
                    const nextIdx = (imagenActivaIdx + 1) % fotos.length;
                    setImagenActivaIdx(nextIdx);
                  }}
                >
                  <Text style={styles.carouselArrowText}>▶</Text>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* BOTÓN VOLVER UNIVERSAL */}
        {onVolver && (
          <Pressable 
            onPress={onVolver}
            onMouseEnter={() => Platform.OS === 'web' && setHoveredBack(true)}
            onMouseLeave={() => Platform.OS === 'web' && setHoveredBack(false)}
            style={[styles.luxeBackButton, hoveredBack && { borderColor: C.gold, backgroundColor: 'rgba(160,120,64,0.15)', transform: [{ scale: 1.02 }] }]}
          >
            <Text style={[styles.luxeBackButtonText, hoveredBack && { color: C.gold }]}>← {t('vd_back', { defaultValue: 'VOLVER AL MENÚ DE INICIO' })}</Text>
          </Pressable>
        )}

        {/* ─── FOOTER OFICIAL REUTILIZABLE ─── */}
        <Footer onNavigate={onNavigate} />

      </ScrollView>

      {/* ════ MODAL DE CONFIRMACIÓN DE COMPRA ════
           Fuera del ScrollView para que se centre en pantalla */}
      {showPurchaseConfirm && (
        <Pressable style={styles.modalOverlay} onPress={() => setShowPurchaseConfirm(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation?.()}
            // Evita que el tap en el card cierre el modal
          >
            {purchaseStatus === 'success' ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                {/* Ícono dorado premium en lugar de emoji */}
                <View style={styles.successIconWrap}>
                  <FontAwesome name="check" size={28} color={C.gold} />
                </View>
                <Text style={styles.modalTitle}>{es ? '¡Suscripción Activada!' : 'Subscription Activated!'}</Text>
                <Text style={styles.modalSubTitle}>INMOVIRAL PLUS</Text>
                <Text style={styles.modalText}>
                  {es
                    ? 'Tu suscripción InmoViral Plus ha sido activada con éxito. Ahora tu publicación aparecerá en destacadas y en el mapa.\n\nRecuerda que tienes soporte 24/7 — escríbenos en cualquier momento y con gusto te atendemos.'
                    : 'Your InmoViral Plus subscription is now active. Your listing will appear in featured lists and map.\n\nRemember you have 24/7 support — reach out anytime and we\'ll be happy to assist.'}
                </Text>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnOk]}
                  onPress={() => { setShowPurchaseConfirm(false); setPurchaseStatus(null); }}
                >
                  <Text style={styles.modalBtnText}>{es ? 'ENTENDIDO' : 'GOT IT'}</Text>
                </Pressable>
              </View>
            ) : purchaseStatus === 'loading' ? (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <View style={[styles.successIconWrap, { borderColor: C.gold }]}>
                  <FontAwesome name="refresh" size={28} color={C.gold} />
                </View>
                <Text style={styles.modalTitle}>{es ? 'Procesando Pago' : 'Processing Payment'}</Text>
                <Text style={styles.modalSubTitle}>{es ? 'Validando tarjeta...' : 'Validating card...'}</Text>
                <Text style={styles.modalText}>
                  {es
                    ? 'Por favor espera unos instantes mientras confirmamos la suscripción con Mercado Pago de forma segura...'
                    : 'Please wait a moment while we securely confirm the subscription with Mercado Pago...'}
                </Text>
              </View>
            ) : purchaseStatus === 'card_form' ? (
              <View style={{ paddingVertical: 10 }}>
                <Text style={styles.modalTitle}>{es ? 'Método de Pago' : 'Payment Method'}</Text>
                <Text style={[styles.modalSubTitle, { marginBottom: 20 }]}>
                  {es ? 'Introduce los datos de tu tarjeta' : 'Enter your card details'}
                </Text>
                
                {/* Formulario de tarjeta simulada */}
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{es ? 'NOMBRE EN LA TARJETA' : 'CARDHOLDER NAME'}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Juan Pérez"
                    placeholderTextColor="rgba(242,237,229,0.30)"
                    value={cardName}
                    onChangeText={setCardName}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>{es ? 'NÚMERO DE TARJETA' : 'CARD NUMBER'}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="4000 1234 5678 9010"
                    placeholderTextColor="rgba(242,237,229,0.30)"
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={handleCardNumberChange}
                  />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={[styles.formGroup, { flex: 1.2, marginRight: 12 }]}>
                    <Text style={styles.inputLabel}>{es ? 'EXPIRACIÓN (MM/AA)' : 'EXPIRATION (MM/YY)'}</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="12/29"
                      placeholderTextColor="rgba(242,237,229,0.30)"
                      keyboardType="numeric"
                      value={cardExpiry}
                      onChangeText={handleExpiryChange}
                      maxLength={5}
                    />
                  </View>
                  <View style={[styles.formGroup, { flex: 0.8 }]}>
                    <Text style={styles.inputLabel}>CVV</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="123"
                      placeholderTextColor="rgba(242,237,229,0.30)"
                      keyboardType="numeric"
                      secureTextEntry
                      value={cardCvv}
                      onChangeText={handleCvvChange}
                      maxLength={4}
                    />
                  </View>
                </View>

                {/* Botones de acción */}
                <View style={[styles.modalBtnRow, { marginTop: 24 }]}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => { setPurchaseStatus(null); setShowPurchaseConfirm(false); }}
                  >
                    <Text style={[styles.modalBtnText, { color: C.textSub }]}>{es ? 'CANCELAR' : 'CANCEL'}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={handleCardSubmit}
                  >
                    <Text style={styles.modalBtnText}>
                      {es ? 'PAGAR $150 MXN' : 'PAY $150 MXN'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View>
                <Text style={styles.modalTitle}>InmoViral Plus</Text>
                <Text style={styles.modalSubTitle}>{es ? 'Activar Suscripción Premium' : 'Activate Premium Subscription'}</Text>
                <Text style={styles.modalText}>
                  {es
                    ? 'Al confirmar, ingresaremos al formulario de pago para realizar el cargo de tu suscripción de $150 MXN mensuales para tu cuenta. Tu publicación ganará visibilidad destacada inmediata.'
                    : 'By confirming, we will open the payment form to process your monthly subscription of $150 MXN. Your listings will gain immediate priority.'}
                </Text>
                <View style={styles.modalBtnRow}>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnCancel]}
                    onPress={() => setShowPurchaseConfirm(false)}
                  >
                    <Text style={[styles.modalBtnText, { color: C.textSub }]}>{es ? 'CANCELAR' : 'CANCEL'}</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalBtn, styles.modalBtnConfirm]}
                    onPress={executePurchase}
                  >
                    <Text style={styles.modalBtnText}>
                      {es ? 'CONFIRMAR COMPRA' : 'CONFIRM PURCHASE'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      )}

    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// HOJA DE ESTILOS BLINDADA NATIVA Y COMPACTA
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Hero
  hero: { minHeight: 440, justifyContent: 'flex-end', backgroundColor: C.bg, overflow: 'hidden', position: 'relative' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,8,0.78)' },
  heroContent: { paddingHorizontal: 32, paddingTop: 110, paddingBottom: 48, maxWidth: 800 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  eyebrowLine: { width: 32, height: 1, backgroundColor: C.gold, marginRight: 12 },
  eyebrow: { color: C.gold, fontSize: 10, fontFamily: C.sans, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '500' },
  heroTitle: { color: C.text, fontSize: 44, lineHeight: 52, fontFamily: C.serif, fontWeight: '300', marginBottom: 16 },
  heroEmphasis: { color: C.goldDeep, fontStyle: 'italic' },
  heroSub: { color: C.textSub, fontSize: 13, lineHeight: 22, fontFamily: C.sans, fontWeight: '300', maxWidth: 540 },

  // Layout Grid Equilibrado (Ajustado para evitar espacios colgados)
  section: { paddingHorizontal: 20, paddingTop: 40, paddingBottom: 40, backgroundColor: C.bg, alignSelf: 'center', width: '100%', maxWidth: 1400 },
  sectionDark: { backgroundColor: '#0A0806', borderTopWidth: 1, borderTopColor: C.borderSoft, borderBottomWidth: 1, borderBottomColor: C.borderSoft, paddingHorizontal: 32, paddingVertical: 56, width: '100%' },
  sectionLabel: { color: C.gold, fontSize: 10, fontFamily: C.sans, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, fontWeight: '500' },
  sectionTitle: { color: C.text, fontSize: 32, lineHeight: 38, fontFamily: C.serif, fontWeight: '300', marginBottom: 24 },
  sectionEmphasis: { color: C.goldDeep, fontStyle: 'italic' },
  flexGridWrapper: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', justifyContent: 'flex-start', alignItems: 'stretch' },
  serviceCardWrapper: { padding: 8 },

  // Tarjetas de Servicios
  serviceCard: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 32, position: 'relative', overflow: 'hidden' },
  serviceCardHovered: { backgroundColor: '#171512', borderColor: 'rgba(160,120,64,0.35)' },
  serviceCardBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: 'transparent' },
  serviceNum: { color: 'rgba(160,120,64,0.12)', fontSize: 52, fontFamily: C.serif, fontWeight: '300', lineHeight: 52, marginBottom: 4 },
  serviceTag: { color: C.gold, fontSize: 9, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8, fontWeight: '500' },
  serviceTitle: { color: C.text, fontSize: 20, lineHeight: 24, fontFamily: C.serif, fontWeight: '400', marginBottom: 10 },
  serviceTitleEm: { color: C.goldDeep, fontStyle: 'italic' },
  serviceDesc: { color: C.textSub, fontSize: 12, lineHeight: 19, fontFamily: C.sans, fontWeight: '300', marginBottom: 16 },
  featuresList: { marginBottom: 16, gap: 6 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureLine: { width: 14, height: 1, backgroundColor: C.gold, marginRight: 10 },
  featureText: { color: C.textSub, fontSize: 12, fontFamily: C.sans, fontWeight: '300' },
  serviceLink: { paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.03)', marginTop: 12 },
  serviceLinkText: { color: C.gold, fontSize: 10, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '500' },

  // Panel de Contacto Expandible
  contactPanel: { marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  contactLabel: { color: C.textSub, fontSize: 12, fontFamily: C.sans, marginBottom: 10, lineHeight: 16 },
  contactRow: { flexDirection: 'row', gap: 10 },
  contactBtn: { flex: 1, height: 38, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' },
  contactBtnWa: { borderColor: C.greenBdr },
  contactBtnText: { color: C.gold, fontSize: 11, fontFamily: C.sans, letterSpacing: 1 },
  contactBtnTextWa: { color: C.green },

  // Garantías Minimalistas Editoriales
  garantiasWrap: { gap: 32, marginTop: 12 },
  garantiaImageWrap: { minHeight: 320, position: 'relative', overflow: 'hidden', backgroundColor: '#1A1714', borderWidth: 1, borderColor: C.border },
  garantiaImage: { width: '100%', height: '100%' },
  garantiaImageOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,13,10,0.45)' },
  garantiaImageLabel: { position: 'absolute', bottom: 24, left: 24, right: 24, color: C.text, fontFamily: C.serif, fontSize: 18, fontStyle: 'italic', fontWeight: '300', lineHeight: 24 },
  garantiasList: { gap: 4, justifyContent: 'center' },
  garantiaMinimalItem: { paddingVertical: 20, borderBottomWidth: 0.5, borderBottomColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12 },
  garantiaMinimalTitle: { color: C.text, fontSize: 14, fontFamily: C.sans, letterSpacing: 1.5, fontWeight: '600', marginBottom: 2 },
  garantiaMinimalSubtitle: { color: C.gold, fontSize: 9, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  garantiaMinimalDesc: { color: C.textSub, fontSize: 12, lineHeight: 18, fontFamily: C.sans, fontWeight: '300' },

  // Módulo Media con Nombres Exactos y Carrusel Smooth
  mudanzaCarouselContainer: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 24, marginTop: 12 },
  mudanzaHeaderRow: { flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  tabSelectorBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(160,120,64,0.25)', paddingVertical: 8, paddingHorizontal: 16 },
  tabSelectorBtnActive: { backgroundColor: C.gold, borderColor: C.gold },
  mudanzaBtnText: { color: C.gold, fontFamily: C.sans, fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  carouselViewerBox: { width: '100%', aspectRatio: 16/9, minHeight: 300, overflow: 'hidden', position: 'relative' },
  carouselImageEngine: { width: '100%', height: '100%' },
  carouselArrowContainer: { ...StyleSheet.absoluteFillObject, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  carouselArrowBtn: { width: 42, height: 42, backgroundColor: 'rgba(15,13,10,0.85)', borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  carouselArrowText: { color: C.text, fontSize: 14 },
  carouselIndicatorsRow: { flexDirection: 'row', gap: 6, alignSelf: 'flex-end', marginBottom: 16, zIndex: 5 },
  indicatorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  indicatorDotActive: { backgroundColor: C.gold, width: 16 },

  // Tarjetas de Planes
  planCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.borderSoft, padding: 28, position: 'relative', overflow: 'hidden', height: '100%' },
  planCardFeatured: { borderColor: 'rgba(160,120,64,0.4)', backgroundColor: 'rgba(160,120,64,0.04)' },
  planCardHovered: { borderColor: 'rgba(160,120,64,0.3)', transform: [{ translateY: -4 }] },
  planBadge: { position: 'absolute', top: 16, right: 16, backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 4 },
  planBadgeText: { color: C.bg, fontSize: 9, fontFamily: C.sans, fontWeight: '600', letterSpacing: 1 },
  planLabel: { color: C.gold, fontSize: 9, fontFamily: C.sans, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  planTitulo: { color: C.text, fontSize: 20, fontFamily: C.serif, fontWeight: '400', marginBottom: 16 },
  planDivider: { height: 1, backgroundColor: C.borderSoft, marginBottom: 14 },
  planPrecio: { color: C.goldDeep, fontSize: 14, fontFamily: C.sans, fontWeight: '500', marginBottom: 24 },
  planFeatures: { marginBottom: 28, gap: 10 },
  planFeatureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  planFeatureCheck: { color: C.gold, fontSize: 12, marginRight: 12, marginTop: 1 },
  planFeatureText: { color: C.textSub, fontSize: 12, fontFamily: C.sans, lineHeight: 18, fontWeight: '300', flex: 1 },
  planBtn: { height: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
  planBtnFeatured: { backgroundColor: C.gold, borderColor: C.gold },
  planBtnText: { color: C.text, fontSize: 11, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase' },
  planBtnTextFeatured: { color: C.bg, fontWeight: '600' },
  cancelPlanBtn: {
    marginTop: 12,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.4)',
    backgroundColor: 'rgba(220,38,38,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelPlanBtnText: {
    color: '#DC2626',
    fontSize: 10,
    fontFamily: C.sans,
    letterSpacing: 2,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  luxeBackButton: { alignSelf: 'center', marginTop: 32, marginBottom: 48, paddingVertical: 12, paddingHorizontal: 24, borderWidth: 1, borderColor: C.borderSoft },
  luxeBackButtonText: { color: C.textSub, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', fontFamily: C.sans, fontWeight: '500' },

  // Footer
  footerContainer: { backgroundColor: '#0A0A0A', borderTopWidth: 1, borderTopColor: 'rgba(160,120,64,0.12)', paddingHorizontal: 48, paddingTop: 60, paddingBottom: 30, width: '100%' },
  footerMainRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', maxWidth: 1200, alignSelf: 'center', marginBottom: 48 },
  footerBrandCol: { flex: 1.5, minWidth: 220, paddingRight: 20 },
  footerLogoText: { fontFamily: C.sans, fontWeight: '300', letterSpacing: 5, fontSize: 20, color: C.text, marginBottom: 20 },
  footerBrandDesc: { fontFamily: C.sans, fontSize: 12, color: C.textSub, lineHeight: 20, fontWeight: '300', marginBottom: 24 },
  socialFlexRow: { flexDirection: 'row', gap: 10 },
  footerSocialBtn: { width: 34, height: 34, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)' },
  footerSocialText: { color: C.textSub, fontSize: 10, fontFamily: C.sans, fontWeight: '500' },
  footerLinksCol: { flex: 1, minWidth: 140 },
  footerColHeading: { fontFamily: C.sans, fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: '600', marginBottom: 20, textTransform: 'uppercase' },
  footerDeltaHeading: { fontFamily: C.sans, fontSize: 11, letterSpacing: 2, color: C.gold, fontWeight: '600', marginBottom: 20, textTransform: 'uppercase' },
  footerLinkText: { fontFamily: C.sans, fontSize: 12, color: C.textSub, marginBottom: 12, fontWeight: '300' },
  footerBottomBar: { width: '100%', maxWidth: 1200, alignSelf: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)', paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 },
  copyText: { fontFamily: C.sans, fontSize: 11, color: 'rgba(252,237,225,0.3)', fontWeight: '300' },
  legalLinksRow: { flexDirection: 'row', gap: 24 },

  // Modal de compra premium — fuera del ScrollView, centrado en pantalla
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    // Blur glassmorphism en web
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(6,5,4,0.55)',
      },
      default: { backgroundColor: 'rgba(6,5,4,0.82)' },
    }),
  },
  modalContent: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, padding: 32, width: '90%', maxWidth: 460, borderRadius: 2 },
  modalTitle: { color: C.text, fontSize: 24, fontFamily: C.serif, fontWeight: '300', marginBottom: 6, textAlign: 'center' },
  modalSubTitle: { color: C.gold, fontSize: 11, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' },
  modalText: { color: C.textSub, fontSize: 13, lineHeight: 22, fontFamily: C.sans, fontWeight: '300', marginBottom: 24, textAlign: 'center' },
  modalBtnRow: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, height: 42, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  modalBtnCancel: { borderColor: 'rgba(255,255,255,0.15)' },
  modalBtnConfirm: { backgroundColor: C.gold, borderColor: C.gold },
  modalBtnOk: { backgroundColor: C.gold, borderColor: C.gold, alignSelf: 'center', width: '50%', marginTop: 8 },
  modalBtnText: { color: C.text, fontSize: 11, fontFamily: C.sans, letterSpacing: 2, textTransform: 'uppercase', fontWeight: '600' },
  successIcon: { fontSize: 48, marginBottom: 16, textAlign: 'center' },
  formGroup: { marginBottom: 12 },
  inputLabel: { color: C.textSub, fontSize: 10, fontFamily: C.sans, letterSpacing: 1, marginBottom: 4 },
  textInput: { backgroundColor: C.surface, color: C.text, borderWidth: 1, borderColor: C.border, borderRadius: 2, paddingVertical: 10, paddingHorizontal: 12, fontSize: 14, fontFamily: C.sans }
});