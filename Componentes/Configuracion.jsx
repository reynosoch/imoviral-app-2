import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const T = {
  gold: '#A07840',
  bg: '#0A0A0A',
  bgAlt: '#111110',
  bgCard: '#161614',
  text: '#F5F5F0',
  textSub: '#8A8A84',
  border: 'rgba(255,255,255,0.08)',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

function ToggleSwitch({ value, onChange }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={() => onChange(!value)}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.toggleTrack,
        value && s.toggleTrackActive,
        hovered && { borderColor: T.gold },
      ]}
    >
      <View style={[s.toggleThumb, value && s.toggleThumbActive]} />
    </Pressable>
  );
}

function SettingsRow({ icon, label, description, children }) {
  return (
    <View style={s.settingsRow}>
      <View style={s.settingsRowLeft}>
        <Feather name={icon} size={16} color={T.gold} style={{ marginRight: 14, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={s.settingsRowLabel}>{label}</Text>
          {description && <Text style={s.settingsRowDesc}>{description}</Text>}
        </View>
      </View>
      <View style={s.settingsRowRight}>{children}</View>
    </View>
  );
}

function LangButton({ lang, label, isActive, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.langBtn,
        isActive && s.langBtnActive,
        hovered && !isActive && { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.05)' },
      ]}
    >
      <Text style={[s.langBtnText, isActive && s.langBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function Configuracion({ onVolver }) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width > 768;
  const esES = i18n.language?.startsWith('es');

  // Settings state (persisted in localStorage on web)
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifMessages, setNotifMessages] = useState(true);
  const [privacyPublic, setPrivacyPublic] = useState(false);
  const [privacyActivity, setPrivacyActivity] = useState(true);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const saved = localStorage.getItem('inmoviral_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.notifEmail !== undefined) setNotifEmail(parsed.notifEmail);
          if (parsed.notifPromos !== undefined) setNotifPromos(parsed.notifPromos);
          if (parsed.notifMessages !== undefined) setNotifMessages(parsed.notifMessages);
          if (parsed.privacyPublic !== undefined) setPrivacyPublic(parsed.privacyPublic);
          if (parsed.privacyActivity !== undefined) setPrivacyActivity(parsed.privacyActivity);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSave = () => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem('inmoviral_settings', JSON.stringify({
          notifEmail, notifPromos, notifMessages, privacyPublic, privacyActivity,
        }));
      } catch (e) {
        console.error(e);
      }
    }
    setFeedback(t('settings.save_success'));
    setTimeout(() => setFeedback(''), 3000);
  };

  const cambiarIdioma = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageContent}>
      <View style={[s.pageHeader, !isWide && { paddingTop: 20 }]}>
        <Text style={s.pageTitle}>{t('settings.page_title')}</Text>
      </View>

      {feedback !== '' && (
        <View style={s.feedbackBar}>
          <Text style={s.feedbackText}>{feedback}</Text>
        </View>
      )}

      <View style={[s.mainContent, { paddingHorizontal: isWide ? 48 : 20, maxWidth: 700 }]}>

        {/* Language */}
        <View style={s.settingsSection}>
          <Text style={s.sectionLabel}>{t('settings.section_language')}</Text>
          <Text style={s.sectionDesc}>{t('settings.section_language_desc')}</Text>
          <View style={s.langRow}>
            <LangButton lang="es" label="Español" isActive={esES} onPress={() => cambiarIdioma('es')} />
            <LangButton lang="en" label="English" isActive={!esES} onPress={() => cambiarIdioma('en')} />
          </View>
        </View>

        {/* Notifications */}
        <View style={s.settingsSection}>
          <Text style={s.sectionLabel}>{t('settings.section_notifications')}</Text>
          <Text style={s.sectionDesc}>{t('settings.section_notifications_desc')}</Text>
          <SettingsRow icon="mail" label={t('settings.notif_email')}>
            <ToggleSwitch value={notifEmail} onChange={setNotifEmail} />
          </SettingsRow>
          <SettingsRow icon="gift" label={t('settings.notif_promos')}>
            <ToggleSwitch value={notifPromos} onChange={setNotifPromos} />
          </SettingsRow>
          <SettingsRow icon="message-circle" label={t('settings.notif_messages')}>
            <ToggleSwitch value={notifMessages} onChange={setNotifMessages} />
          </SettingsRow>
        </View>

        {/* Privacy */}
        <View style={s.settingsSection}>
          <Text style={s.sectionLabel}>{t('settings.section_privacy')}</Text>
          <Text style={s.sectionDesc}>{t('settings.section_privacy_desc')}</Text>
          <SettingsRow icon="eye" label={t('settings.privacy_profile')}>
            <ToggleSwitch value={privacyPublic} onChange={setPrivacyPublic} />
          </SettingsRow>
          <SettingsRow icon="activity" label={t('settings.privacy_activity')}>
            <ToggleSwitch value={privacyActivity} onChange={setPrivacyActivity} />
          </SettingsRow>
        </View>

        {/* About */}
        <View style={s.settingsSection}>
          <Text style={s.sectionLabel}>{t('settings.section_about')}</Text>
          <View style={s.aboutRow}>
            <Text style={s.aboutLabel}>{t('settings.app_name')}</Text>
            <Text style={s.aboutValue}>{t('settings.app_version')} 2.0.0</Text>
          </View>
        </View>

        {/* Save */}
        <Pressable style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveBtnText}>{t('settings.save_btn')}</Text>
        </Pressable>
      </View>

      {onVolver && (
        <Pressable style={s.backBtn} onPress={onVolver}>
          <Text style={s.backBtnText}>{t('vd_back')}</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bg },
  pageContent: { paddingBottom: 60 },

  pageHeader: {
    paddingTop: 100,
    paddingBottom: 32,
    paddingHorizontal: 32,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: T.bgAlt,
  },
  pageTitle: { color: T.text, fontSize: 28, fontFamily: T.serif, fontWeight: '400' },

  feedbackBar: {
    backgroundColor: 'rgba(160,120,64,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginHorizontal: 32,
    marginTop: 20,
  },
  feedbackText: { color: T.gold, fontSize: 13, fontFamily: T.sans, textAlign: 'center' },

  mainContent: { paddingTop: 32, alignSelf: 'center', width: '100%' },

  settingsSection: {
    backgroundColor: T.bgAlt,
    borderWidth: 1,
    borderColor: T.border,
    padding: 28,
    marginBottom: 20,
  },
  sectionLabel: { color: T.text, fontSize: 18, fontFamily: T.serif, fontWeight: '400', marginBottom: 6 },
  sectionDesc: { color: T.textSub, fontSize: 12, fontFamily: T.sans, lineHeight: 18, marginBottom: 20 },

  langRow: { flexDirection: 'row', gap: 12 },
  langBtn: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.15s ease' }, default: {} }),
  },
  langBtnActive: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.1)' },
  langBtnText: { color: T.textSub, fontSize: 13, fontFamily: T.sans, fontWeight: '500' },
  langBtnTextActive: { color: T.gold, fontWeight: '600' },

  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  settingsRowLeft: { flexDirection: 'row', flex: 1, alignItems: 'flex-start' },
  settingsRowRight: {},
  settingsRowLabel: { color: T.text, fontSize: 13, fontFamily: T.sans, fontWeight: '500' },
  settingsRowDesc: { color: T.textSub, fontSize: 11, fontFamily: T.sans, marginTop: 2 },

  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: T.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
    ...Platform.select({ web: { cursor: 'pointer', transition: 'all 0.2s ease' }, default: {} }),
  },
  toggleTrackActive: { backgroundColor: 'rgba(160,120,64,0.25)', borderColor: T.gold },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.textSub,
    ...Platform.select({ web: { transition: 'all 0.2s ease' }, default: {} }),
  },
  toggleThumbActive: { backgroundColor: T.gold, alignSelf: 'flex-end' },

  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  aboutLabel: { color: T.text, fontSize: 13, fontFamily: T.sans },
  aboutValue: { color: T.textSub, fontSize: 13, fontFamily: T.sans },

  saveBtn: {
    backgroundColor: T.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  saveBtnText: { color: '#000', fontSize: 11, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },

  backBtn: {
    alignSelf: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: T.textSub, fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: '500' },
});
