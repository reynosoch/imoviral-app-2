import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesome } from '@expo/vector-icons';

const LUXURY_FONT = Platform.OS === 'ios' ? 'Didot' : Platform.OS === 'android' ? 'serif' : 'PlayfairDisplay_400Regular';
const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'android' ? 'serif' : 'PlayfairDisplay_400Regular';
const SANS_FONT = Platform.OS === 'ios' ? 'System' : 'Inter_400Regular';

function SocialSquare({ label }) {
  const [hovered, setHovered] = useState(false);

  const handlePress = async () => {
    let url = '';
    if (label === 'IG') {
      url = 'https://www.instagram.com/inmoviralbis?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
    } else if (label === 'WH') {
      url = 'https://wa.me/526181630471';
    } else if (label === 'GM') {
      url = 'mailto:ventas@inmoviral.com.mx';
    } else if (label === 'FB') {
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
    if (label === 'IG') return 'instagram';
    if (label === 'WH') return 'whatsapp';
    if (label === 'FB') return 'facebook';
    if (label === 'GM') return 'envelope';
    return 'circle';
  };

  const activeColor = hovered ? '#A07840' : 'rgba(255,255,255,0.4)';

  return (
    <TouchableOpacity
      onPress={handlePress}
      {...(Platform.OS === 'web' ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } : {})}
      style={[styles.socialIconSquare, hovered && styles.socialIconSquareHovered]}
      activeOpacity={0.7}
    >
      <FontAwesome name={getIconName()} size={16} color={activeColor} />
    </TouchableOpacity>
  );
}

function FooterLink({ text, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <TouchableOpacity
      onPress={onPress}
      {...(Platform.OS === 'web' ? { onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) } : {})}
      style={styles.footerLinkTouch}
      activeOpacity={0.7}
    >
      <Text style={[styles.footerLinkItem, hovered && styles.footerLinkItemHovered]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

export default function Footer({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const esPantallaMediana = width > 768;
  const esES = i18n.language.startsWith('es');

  return (
    <View style={styles.footerContainer}>
      <View style={[styles.footerGrid, { flexDirection: esPantallaMediana ? 'row' : 'column' }]}>
        
        {/* Columna 1: Marca & Redes Animadas */}
        <View style={[styles.footerColumnUnit, { width: esPantallaMediana ? '38%' : '100%' }]}>
          <Text style={styles.footerLogoText}>INMOVIRAL</Text>
          <Text style={styles.footerBrandDesc}>
            {t('footer.desc', { defaultValue: 'Experiencia inmobiliaria de alto nivel. Seleccionamos las mejores propiedades para clientes exigentes.' })}
          </Text>
          <View style={styles.footerSocialContainer}>
            {['WH', 'IG', 'GM'].map((red) => (
              <SocialSquare key={red} label={red} />
            ))}
          </View>
        </View>

        {/* Columna 2: Empresa Animada */}
        <View style={[styles.footerColumnUnit, { width: esPantallaMediana ? '25%' : '100%' }]}>
          <Text style={styles.footerColTitle}>{t('footer.company_t', { defaultValue: 'EMPRESA' })}</Text>
          <FooterLink text={esES ? 'Sobre Nosotros' : 'About Us'} onPress={() => onNavigate && onNavigate('nosotros')} />
          <FooterLink text={esES ? 'Propiedades' : 'Properties'} onPress={() => onNavigate && onNavigate('venta')} />
          <FooterLink text={esES ? 'Nuestro Equipo' : 'Our Team'} onPress={() => onNavigate && onNavigate('nosotros', 'equipo')} />
          <FooterLink text={esES ? 'Testimonios' : 'Testimonials'} onPress={() => onNavigate && onNavigate('resenas')} />
        </View>

        {/* Columna 3: Contacto */}
        <View style={[styles.footerColumnUnit, { width: esPantallaMediana ? '30%' : '100%' }]}>
          <Text style={styles.footerColTitle}>{t('footer.contact_t', { defaultValue: 'CONTACTO' })}</Text>
          <Text style={styles.footerInfoItem}>📞 +52 6181630471</Text>
          <Text style={styles.footerInfoItem}>✉️ ventas@inmoviral.com.mx</Text>
          <Text style={styles.footerInfoItem}>📍 {t('footer.address', { defaultValue: 'Distrito Uno, Chihuahua, MX' })}</Text>
          <Text style={styles.footerInfoItem}>🕒 {t('footer.hours', { defaultValue: 'Lunes a Viernes 9:00 - 18:00' })}</Text>
        </View>

      </View>

      {/* Copyright Inferior */}
      <View style={styles.footerBottomBar}>
        <Text style={styles.footerCopyright}>© 2026 INMOVIRAL. All rights reserved.</Text>
        <View style={styles.footerBottomRightLinks}>
          <Text style={styles.footerCopyrightLink}>{esES ? 'Política de Privacidad' : 'Privacy Policy'}</Text>
          <Text style={styles.footerCopyrightLink}>{esES ? 'Términos de Uso' : 'Terms of Use'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ══ 💎 ESTILOS EXCLUSIVOS DEL FOOTER 4 COLUMNAS PREMIUM ══
  footerContainer: { paddingVertical: 80, paddingHorizontal: 60, backgroundColor: '#0F0D0A', borderTopWidth: 1, borderColor: 'rgba(160,120,64,0.2)' },
  footerGrid: { justifyContent: 'space-between', gap: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  footerColumnUnit: { gap: 14, marginBottom: 20 },
  footerLogoText: { fontFamily: LUXURY_FONT, fontSize: 24, fontWeight: '400', color: '#FDFBF8', letterSpacing: 8, textTransform: 'uppercase', marginBottom: 10 },
  footerBrandDesc: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 22, fontWeight: '300', fontFamily: SANS_FONT },
  footerSocialContainer: { flexDirection: 'row', gap: 14, marginTop: 15 },

  socialIconSquare: { width: 36, height: 36, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  socialIconSquareHovered: { borderColor: '#A07840', backgroundColor: 'rgba(160,120,64,0.15)', transform: [{ scale: 1.15 }] },

  footerColTitle: { fontFamily: SERIF_FONT, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, fontWeight: '400', textTransform: 'uppercase', marginBottom: 10 },
  footerLinkTouch: { paddingVertical: 2 },

  footerLinkItem: { color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: '300', marginBottom: 4, fontFamily: SANS_FONT },
  footerLinkItemHovered: { color: '#A07840', transform: [{ scale: 1.05 }] },

  footerInfoItem: { color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 22, fontWeight: '300', fontFamily: SANS_FONT },
  footerBottomBar: { borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)', marginTop: 40, paddingTop: 32, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  footerCopyright: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: SANS_FONT },
  footerBottomRightLinks: { flexDirection: 'row', gap: 24 },
  footerCopyrightLink: { color: 'rgba(255,255,255,0.2)', fontSize: 12, fontFamily: SANS_FONT },
});
