import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import { fetchModerators, saveModerators, fetchRequests, saveRequests, updateRequestStatus, fetchUsers, saveUsers, forceSyncFromSupabase, upsertUser, submitRequest } from './systemSync';

const T = {
  gold: '#A07840',
  goldHover: '#C39B5F',
  bg: '#0A0A0A',
  bgAlt: '#111110',
  bgCard: '#161614',
  text: '#F5F5F0',
  textSub: '#8A8A84',
  border: 'rgba(255,255,255,0.08)',
  borderGold: 'rgba(160,120,64,0.2)',
  danger: '#C05050',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};


function SidebarItem({ icon, label, isActive, onPress }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        s.sideItem,
        isActive && s.sideItemActive,
        hovered && !isActive && s.sideItemHover,
      ]}
    >
      <Feather name={icon} size={16} color={isActive ? T.gold : hovered ? T.text : T.textSub} style={{ marginRight: 12 }} />
      <Text style={[s.sideItemText, isActive && { color: T.gold }, hovered && !isActive && { color: T.text }]}>{label}</Text>
      <Feather name="chevron-right" size={14} color={isActive ? T.gold : T.textSub} style={{ marginLeft: 'auto' }} />
    </Pressable>
  );
}

export default function Perfil({ onVolver }) {
  const { t, i18n } = useTranslation();
  const { user, signOut, updateUserMetadata } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 900;
  const esES = i18n.language?.startsWith('es');
  const hasInitialized = React.useRef(false);
  const ADMIN_ID = 'admin-id-0000';
  const isAdmin = user?.isAdmin || user?.id === ADMIN_ID;

  const [activeSection, setActiveSection] = useState('datos');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');

  // Admin and Moderation states
  const [usersList, setUsersList] = useState([]);
  const [moderatorIds, setModeratorIds] = useState([]);
  const [requestsList, setRequestsList] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  // States for password confirmation modal
  const [actionConfirmVisible, setActionConfirmVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmActionType, setConfirmActionType] = useState('');
  const [confirmActionPayload, setConfirmActionPayload] = useState(null);

  // States for editing a user inline
  const [editingUser, setEditingUser] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editTipo, setEditTipo] = useState('');

  const [currentUserReg, setCurrentUserReg] = useState(null);

  useEffect(() => {
    const checkPlusStatus = async () => {
      if (user) {
        try {
          const list = await fetchUsers();
          const found = list.find(u => u.id === user.id);
          setCurrentUserReg(found || null);
        } catch (e) {
          console.warn("Error checking user plus status in Perfil:", e);
        }
      }
    };
    checkPlusStatus();
  }, [user, activeSection]);

  useEffect(() => {
    if (user && !hasInitialized.current) {
      const meta = user.user_metadata || {};
      // Normalize across providers: Google uses 'name', email/pass uses 'full_name'
      const fullName = meta.full_name || meta.name || meta.display_name || '';
      const phone = meta.phone || meta.phone_number || '';
      const avatarUrl = meta.avatar_url || meta.picture || null;

      setNombre(fullName);
      setTelefono(phone);
      setAvatarUri(avatarUrl);
      hasInitialized.current = true;

      // Register this user in the system user registry
      if (!user.isAdmin) {
        import('./systemSync').then(({ upsertUser }) => {
          upsertUser({
            id: user.id,
            email: user.email || meta.email || '',
            full_name: fullName,
            phone: phone,
            avatar_url: avatarUrl || '',
            provider: user.app_metadata?.provider || 'email',
            registered_at: user.created_at || new Date().toISOString(),
          }).catch(() => {});
        });
      }
    }
  }, [user]);

  const cargarAdminData = async () => {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    try {
      // Source 1: System registry (populated on every login going forward)
      const registryUsers = await fetchUsers();

      // Source 2: Extract unique users from propiedades table
      const { data: props } = await supabase
        .from('propiedades')
        .select('user_id, nombre_contacto, email_contacto, avatar_url_contacto')
        .not('user_id', 'is', null);

      // Source 3: Extract unique users from resenas table (has user_id, user_name, user_email)
      const { data: resenas } = await supabase
        .from('resenas')
        .select('user_id, user_name, user_email, avatar_url')
        .not('user_id', 'is', null);

      // Source 4: Extract unique users from chat_rooms (has comprador/vendedor pairs)
      const { data: chats } = await supabase
        .from('chat_rooms')
        .select('comprador_id, comprador_nombre, vendedor_id, vendedor_nombre')
        .not('comprador_id', 'is', null);

      // Build fallback map from all sources
      const fallbackMap = {};

      const addToMap = (id, record) => {
        if (!id) return;
        if (!fallbackMap[id]) fallbackMap[id] = { id, email: '', full_name: '', phone: '', avatar_url: '', registered_at: null };
        // Merge — don't overwrite non-empty values
        if (!fallbackMap[id].email && record.email) fallbackMap[id].email = record.email;
        if (!fallbackMap[id].full_name && record.full_name) fallbackMap[id].full_name = record.full_name;
        if (!fallbackMap[id].avatar_url && record.avatar_url) fallbackMap[id].avatar_url = record.avatar_url;
      };

      if (props) {
        props.forEach(p => addToMap(p.user_id, {
          email: p.email_contacto || '',
          full_name: p.nombre_contacto || '',
          avatar_url: p.avatar_url_contacto || '',
        }));
      }
      if (resenas) {
        resenas.forEach(r => addToMap(r.user_id, {
          email: r.user_email || '',
          full_name: r.user_name || '',
          avatar_url: r.avatar_url || '',
        }));
      }
      if (chats) {
        chats.forEach(c => {
          // Each chat has comprador and vendedor — add both
          addToMap(c.comprador_id, { email: '', full_name: c.comprador_nombre || '', avatar_url: '' });
          addToMap(c.vendedor_id, { email: '', full_name: c.vendedor_nombre || '', avatar_url: '' });
        });
      }

      // Merge: registry takes precedence, fallback fills the gap
      const registryIds = new Set(registryUsers.map(u => u.id));
      const extra = Object.values(fallbackMap).filter(u => !registryIds.has(u.id));
      const merged = [...registryUsers, ...extra];

      // Sort: registry (full data) first, then fallback entries
      merged.sort((a, b) => {
        if (a.email && !b.email) return -1;
        if (!a.email && b.email) return 1;
        return (a.full_name || '').localeCompare(b.full_name || '');
      });

      setUsersList(merged);

      const mods = await fetchModerators();
      setModeratorIds(mods);
      const reqs = await fetchRequests();
      setRequestsList(reqs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdmin(false);
    }
  };


  useEffect(() => {
    if (isAdmin && (activeSection === 'moderadores' || activeSection === 'usuarios')) {
      cargarAdminData();
    }
  }, [activeSection, user]);

  const triggerActionConfirm = (type, payload) => {
    setConfirmActionType(type);
    setConfirmActionPayload(payload);
    setConfirmPassword('');
    setActionConfirmVisible(true);
  };

  const handleExecuteConfirmedAction = async () => {
    if (confirmPassword !== 'admin') {
      alert(esES ? 'Contraseña de administrador incorrecta.' : 'Incorrect admin password.');
      return;
    }

    setActionConfirmVisible(false);
    const payload = confirmActionPayload;

    try {
      if (confirmActionType === 'save_user') {
        // Update in system registry
        const updatedList = usersList.map(u =>
          u.id === payload.id
            ? { ...u, full_name: editNombre, phone: editTelefono, tipo_cliente: editTipo }
            : u
        );
        await saveUsers(updatedList);
        setUsersList(updatedList);
        setEditingUser(null);
        setFeedback(t('profile.save_success'));
        setTimeout(() => setFeedback(''), 3000);
      }
      else if (confirmActionType === 'delete_user') {
        // Delete all their properties
        await supabase.from('propiedades').delete().eq('user_id', payload.id);
        // Remove from system user registry
        const updatedList = usersList.filter(u => u.id !== payload.id);
        await saveUsers(updatedList);
        // Also remove moderator if applicable
        const newMods = moderatorIds.filter(id => id !== payload.id);
        if (newMods.length !== moderatorIds.length) await saveModerators(newMods);
        setUsersList(updatedList);
        setModeratorIds(newMods);
        setFeedback(esES ? 'Usuario eliminado correctamente.' : 'User deleted successfully.');
        setTimeout(() => setFeedback(''), 3000);
      }
      else if (confirmActionType === 'toggle_moderator') {
        const isMod = moderatorIds.includes(payload.userId);
        let newMods = [];
        if (isMod) {
          newMods = moderatorIds.filter(id => id !== payload.userId);
        } else {
          newMods = [...moderatorIds, payload.userId];
        }
        await saveModerators(newMods);
        setModeratorIds(newMods);
        setFeedback(esES ? 'Permisos de moderador actualizados.' : 'Moderator status updated.');
        setTimeout(() => setFeedback(''), 3000);
      }
      else if (confirmActionType === 'toggle_inmoviral_plus') {
        const updatedList = usersList.map(u =>
          u.id === payload.userId
            ? { ...u, inmoviralPlus: !u.inmoviralPlus }
            : u
        );
        await saveUsers(updatedList);
        setUsersList(updatedList);
        setFeedback(esES ? 'Suscripción InmoViral Plus actualizada.' : 'InmoViral Plus subscription updated.');
        setTimeout(() => setFeedback(''), 3000);
      }
      else if (confirmActionType === 'approve_request') {
        if (payload.action === 'delete_property') {
          await supabase.from('propiedades').delete().eq('id', payload.targetId);
        } else if (payload.action === 'delete_review') {
          await supabase.from('resenas').delete().eq('id', payload.targetId);
        } else if (payload.action === 'delete_chat_room') {
          await supabase.from('chat_messages').delete().eq('room_id', payload.targetId);
          await supabase.from('chat_rooms').delete().eq('id', payload.targetId);
        } else if (payload.action === 'delete_chat_message') {
          await supabase.from('chat_messages').delete().eq('id', payload.targetId);
        }
        await updateRequestStatus(payload.reqId, 'approved');
        const reqs = await fetchRequests();
        setRequestsList(reqs);
        setFeedback(esES ? 'Solicitud aprobada y ejecutada.' : 'Request approved and executed.');
        setTimeout(() => setFeedback(''), 3000);
      }
      else if (confirmActionType === 'reject_request') {
        await updateRequestStatus(payload.reqId, 'rejected');
        const reqs = await fetchRequests();
        setRequestsList(reqs);
        setFeedback(esES ? 'Solicitud rechazada.' : 'Request rejected.');
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (e) {
      console.error(e);
      setFeedback(t('profile.save_error'));
      setTimeout(() => setFeedback(''), 3000);
    }
  };

  const obtenerIniciales = () => {
    if (!user) return 'US';
    if (user.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0][0].toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length > 0) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUri;
      if (avatarUri && !avatarUri.startsWith('http') && !avatarUri.startsWith('data:')) {
        try {
          const resp = await fetch(avatarUri);
          const blob = await resp.blob();
          const ext = avatarUri.split('.').pop()?.split('?')[0] || 'jpg';
          const path = `avatars/${user.id}_${Date.now()}.${ext}`;
          const { error: uploadError } = await supabase.storage
            .from('propiedades')
            .upload(path, blob, { cacheControl: '3600', upsert: true });
          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('propiedades')
              .getPublicUrl(path);
            finalAvatarUrl = publicUrlData.publicUrl;
            setAvatarUri(finalAvatarUrl);
          } else {
            console.error("Avatar upload error:", uploadError);
          }
        } catch (uploadErr) {
          console.error("Error processing avatar upload:", uploadErr);
        }
      }

      await updateUserMetadata({
        full_name: nombre,
        phone: telefono,
        avatar_url: finalAvatarUrl,
      });
      setFeedback(t('profile.save_success'));
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(t('profile.save_error'));
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPwd !== confirmPwd) {
      setFeedback(esES ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    if (newPwd.length < 6) {
      setFeedback(esES ? 'La contraseña debe tener al menos 6 caracteres.' : 'Password must be at least 6 characters.');
      setTimeout(() => setFeedback(''), 3000);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      setFeedback(esES ? 'Contraseña actualizada correctamente.' : 'Password updated successfully.');
      setOldPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      setFeedback(e.message || t('profile.save_error'));
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(t('profile.delete_confirm'))
      : true;
    if (!confirmed) return;
    try {
      // Borrar automáticamente todas las publicaciones del usuario antes de cerrar sesión (para pasar políticas RLS)
      const { error: deletePropsError } = await supabase
        .from('propiedades')
        .delete()
        .eq('user_id', user.id);

      if (deletePropsError) {
        console.error("Error al eliminar las publicaciones del usuario:", deletePropsError);
      }

      await signOut();
      if (onVolver) onVolver();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelSubscription = async () => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(esES ? '¿Estás seguro de que deseas cancelar tu suscripción InmoViral Plus?' : 'Are you sure you want to cancel your InmoViral Plus subscription?')
      : true;
    
    if (!confirmed) return;

    setSaving(true);
    try {
      const record = {
        ...currentUserReg,
        id: user.id,
        inmoviralPlus: false,
        updated_at: new Date().toISOString()
      };
      await upsertUser(record);
      setCurrentUserReg(record);

      await submitRequest({
        id: 'req-' + Date.now(),
        action: 'inmoviral_plus_cancel',
        targetId: user.id,
        targetName: user.user_metadata?.full_name || user.email || 'Usuario',
        message: `El usuario canceló su suscripción InmoViral Plus`,
        status: 'pending'
      });

      setFeedback(esES ? 'Tu suscripción InmoViral Plus ha sido cancelada.' : 'Your InmoViral Plus subscription has been canceled.');
      setTimeout(() => setFeedback(''), 3000);
    } catch (e) {
      console.error(e);
      setFeedback(esES ? 'Error al cancelar la suscripción.' : 'Error canceling subscription.');
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const renderDatos = () => (
    <View style={s.sectionContent}>
      <Text style={s.sectionHeading}>{t('profile.section_personal')}</Text>
      <Text style={s.sectionDesc}>{t('profile.section_personal_desc')}</Text>

      {/* Avatar */}
      <View style={s.avatarSection}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={s.avatarLarge} />
        ) : (
          <View style={s.avatarLargePlaceholder}>
            <Text style={s.avatarLargeInitials}>{obtenerIniciales()}</Text>
          </View>
        )}
        <View style={s.avatarActions}>
          <Pressable style={s.avatarBtn} onPress={pickImage}>
            <Feather name="camera" size={14} color={T.gold} />
            <Text style={s.avatarBtnText}>{t('profile.photo_change')}</Text>
          </Pressable>
          {avatarUri && (
            <Pressable style={s.avatarBtn} onPress={() => setAvatarUri(null)}>
              <Feather name="x" size={14} color={T.danger} />
              <Text style={[s.avatarBtnText, { color: T.danger }]}>{t('profile.photo_remove')}</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Badge InmoViral Plus */}
      {currentUserReg?.inmoviralPlus && (
        <View style={s.plusBadgeContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="star" size={15} color={T.gold} style={{ marginRight: 8 }} />
              <Text style={s.plusBadgeText}>
                {esES ? 'MIEMBRO INMOVIRAL PLUS' : 'INMOVIRAL PLUS MEMBER'}
              </Text>
            </View>
            <Pressable 
              style={s.cancelSubBtn} 
              onPress={handleCancelSubscription}
              disabled={saving}
            >
              <Text style={s.cancelSubBtnText}>
                {esES ? 'CANCELAR SUSCRIPCIÓN' : 'CANCEL SUBSCRIPTION'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_name')}</Text>
        <TextInput style={s.fieldInput} value={nombre} onChangeText={setNombre} placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_email')}</Text>
        <View style={[s.fieldInput, s.fieldReadonly]}>
          <Text style={s.fieldReadonlyText}>{user?.email || ''}</Text>
        </View>
      </View>

      <Text style={[s.sectionHeading, { marginTop: 40 }]}>{t('profile.section_contact')}</Text>
      <Text style={s.sectionDesc}>{t('profile.section_contact_desc')}</Text>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_phone')}</Text>
        <TextInput style={s.fieldInput} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{t('profile.label_type')}</Text>
        <View style={[s.fieldInput, s.fieldReadonly]}>
          <Text style={s.fieldReadonlyText}>{user?.user_metadata?.client_type || (esES ? 'Comprador' : 'Buyer')}</Text>
        </View>
      </View>

      <Pressable style={s.saveBtn} onPress={handleSaveProfile} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={s.saveBtnText}>{t('profile.save_btn')}</Text>
        )}
      </Pressable>
    </View>
  );

  const renderPassword = () => (
    <View style={s.sectionContent}>
      <Text style={s.sectionHeading}>{esES ? 'Cambiar Contraseña' : 'Change Password'}</Text>
      <Text style={s.sectionDesc}>{esES ? 'Actualiza tu contraseña de acceso.' : 'Update your access password.'}</Text>

      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{esES ? 'Nueva contraseña' : 'New password'}</Text>
        <TextInput style={s.fieldInput} value={newPwd} onChangeText={setNewPwd} secureTextEntry placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>
      <View style={s.fieldGroup}>
        <Text style={s.fieldLabel}>{esES ? 'Confirmar contraseña' : 'Confirm password'}</Text>
        <TextInput style={s.fieldInput} value={confirmPwd} onChangeText={setConfirmPwd} secureTextEntry placeholderTextColor="rgba(242,237,229,0.3)" />
      </View>

      <Pressable style={s.saveBtn} onPress={handleChangePassword} disabled={saving}>
        {saving ? (
          <ActivityIndicator size="small" color="#000" />
        ) : (
          <Text style={s.saveBtnText}>{esES ? 'ACTUALIZAR CONTRASEÑA' : 'UPDATE PASSWORD'}</Text>
        )}
      </Pressable>
    </View>
  );

  const renderDeleteAccount = () => (
    <View style={s.sectionContent}>
      <Text style={s.sectionHeading}>{t('profile.delete_account')}</Text>
      <Text style={s.sectionDesc}>{t('profile.delete_confirm')}</Text>
      <Pressable style={s.deleteBtn} onPress={handleDeleteAccount}>
        <Feather name="alert-triangle" size={14} color="#FFF" style={{ marginRight: 8 }} />
        <Text style={s.deleteBtnText}>{t('profile.delete_btn')}</Text>
      </Pressable>
    </View>
  );

  // ─── Moderadores ───────────────────────────────────────────────────────────
  const renderModeradores = () => (
    <View style={s.sectionContent}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={s.sectionHeading}>{esES ? 'Gestión de Moderadores' : 'Moderator Management'}</Text>
        <View style={{ gap: 6 }}>
          <Pressable
            style={[s.reqBtn, { backgroundColor: 'rgba(160,120,64,0.12)', borderColor: 'rgba(160,120,64,0.3)' }]}
            onPress={cargarAdminData}
          >
            <Feather name="refresh-cw" size={12} color={T.gold} style={{ marginRight: 5 }} />
            <Text style={[s.reqBtnText, { color: T.gold }]}>{esES ? 'ACTUALIZAR' : 'REFRESH'}</Text>
          </Pressable>
          <Pressable
            style={[s.reqBtn, { backgroundColor: 'rgba(59,130,246,0.08)', borderColor: 'rgba(59,130,246,0.25)' }]}
            onPress={async () => {
              try {
                await forceSyncFromSupabase();
                await cargarAdminData();
              } catch(e) { console.error(e); }
            }}
          >
            <Feather name="cloud-download" size={12} color="#60A5FA" style={{ marginRight: 5 }} />
            <Text style={[s.reqBtnText, { color: '#60A5FA' }]}>{esES ? 'SYNC SUPABASE' : 'SYNC SUPABASE'}</Text>
          </Pressable>
        </View>
      </View>
      <Text style={s.sectionDesc}>
        {esES
          ? 'Activa o desactiva permisos de moderador para los usuarios registrados. Los moderadores pueden solicitar acciones que requieren tu aprobación.'
          : 'Enable or disable moderator permissions for registered users. Moderators can request actions that require your approval.'}
      </Text>

      {/* Pending requests - shown prominently */}
      {requestsList.filter(r => r.status === 'pending').length > 0 ? (
        <View style={s.reqSection}>
          <Text style={s.reqSectionTitle}>
            {`📋 ${esES ? 'Solicitudes Pendientes' : 'Pending Requests'} (${requestsList.filter(r => r.status === 'pending').length})`}
          </Text>
          {requestsList.filter(r => r.status === 'pending').map(req => (
            <View key={req.id} style={s.reqCard}>
              <View style={s.reqCardHeader}>
                <Feather name="clock" size={14} color={T.gold} style={{ marginRight: 6 }} />
                <Text style={s.reqAction}>
                  {req.action === 'delete_property' ? (esES ? 'Eliminar propiedad' : 'Delete property') :
                   req.action === 'delete_review' ? (esES ? 'Eliminar reseña' : 'Delete review') :
                   req.action}
                </Text>
                <Text style={s.reqStatus}>PENDIENTE</Text>
              </View>
              {req.targetName && (
                <Text style={[s.reqReason, { color: T.text, fontWeight: '600', marginBottom: 4 }]}>
                  📌 {req.targetName}
                </Text>
              )}
              <View style={{ backgroundColor: 'rgba(160,120,64,0.06)', padding: 10, marginBottom: 6, borderLeftWidth: 2, borderLeftColor: T.gold }}>
                <Text style={[s.reqReason, { fontStyle: 'italic' }]}>
                  "{req.message || req.reason || (esES ? 'Sin motivo especificado' : 'No reason given')}"
                </Text>
              </View>
              <Text style={s.reqMeta}>
                🛡 {esES ? 'Moderador ID: ' : 'Moderator ID: '}{req.moderatorId}
              </Text>
              <Text style={s.reqMeta}>
                🕐 {new Date(parseInt(req.id?.replace('req-', '') || 0)).toLocaleString()}
              </Text>
              <View style={s.reqActions}>
                <Pressable
                  style={[s.reqBtn, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', flex: 1 }]}
                  onPress={() => triggerActionConfirm('approve_request', { reqId: req.id, action: req.action, targetId: req.targetId })}
                >
                  <Feather name="check" size={13} color="#22C55E" style={{ marginRight: 5 }} />
                  <Text style={[s.reqBtnText, { color: '#22C55E' }]}>{esES ? '✓ APROBAR Y EJECUTAR' : '✓ APPROVE & EXECUTE'}</Text>
                </Pressable>
                <Pressable
                  style={[s.reqBtn, { backgroundColor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.4)', flex: 1 }]}
                  onPress={() => triggerActionConfirm('reject_request', { reqId: req.id })}
                >
                  <Feather name="x" size={13} color="#DC2626" style={{ marginRight: 5 }} />
                  <Text style={[s.reqBtnText, { color: '#DC2626' }]}>{esES ? '✗ RECHAZAR' : '✗ REJECT'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[s.reqSection, { backgroundColor: 'rgba(34,197,94,0.04)', borderColor: 'rgba(34,197,94,0.15)' }]}>
          <Text style={[s.reqSectionTitle, { color: '#22C55E' }]}>
            {esES ? '✓ Sin solicitudes pendientes' : '✓ No pending requests'}
          </Text>
        </View>
      )}

      {/* User list with moderator toggles */}
      {loadingAdmin ? (
        <ActivityIndicator size="large" color={T.gold} style={{ marginTop: 40 }} />
      ) : usersList.length === 0 ? (
        <Text style={s.emptyText}>{esES ? 'No hay usuarios registrados.' : 'No registered users.'}</Text>
      ) : (
        usersList.map(u => {
          const isMod = moderatorIds.includes(u.id);
          return (
            <View key={u.id} style={[s.userCard, isMod && { borderLeftColor: T.gold, borderLeftWidth: 3 }]}>
              <View style={s.userCardAvatar}>
                <Text style={s.userCardInitials}>
                  {(u.full_name || u.email || '?').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>{u.full_name || (esES ? 'Sin nombre' : 'No name')}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
                <Text style={s.userMeta}>
                  {isMod ? (esES ? '🛡 Moderador activo' : '🛡 Active moderator') : (esES ? 'Usuario regular' : 'Regular user')}
                </Text>
              </View>
              <Pressable
                style={[s.modToggleBtn, isMod && s.modToggleBtnActive]}
                onPress={() => triggerActionConfirm('toggle_moderator', { userId: u.id })}
              >
                <Feather name={isMod ? 'shield-off' : 'shield'} size={13} color={isMod ? '#DC2626' : T.gold} style={{ marginRight: 5 }} />
                <Text style={[s.modToggleText, isMod && { color: '#DC2626' }]}>
                  {isMod ? (esES ? 'QUITAR' : 'REMOVE') : (esES ? 'HACER MOD' : 'MAKE MOD')}
                </Text>
              </Pressable>
            </View>
          );
        })
      )}

      {/* Admin password confirm modal */}
      {actionConfirmVisible && (
        <View style={s.confirmOverlay}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>{esES ? '🔐 Confirmación Admin' : '🔐 Admin Confirmation'}</Text>
            <Text style={s.confirmDesc}>
              {esES ? 'Ingresa la contraseña de administrador para continuar.' : 'Enter the admin password to continue.'}
            </Text>
            <TextInput
              style={s.confirmInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder={esES ? 'Contraseña de admin' : 'Admin password'}
              placeholderTextColor="rgba(242,237,229,0.3)"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable style={s.confirmCancelBtn} onPress={() => setActionConfirmVisible(false)}>
                <Text style={s.confirmCancelText}>{esES ? 'Cancelar' : 'Cancel'}</Text>
              </Pressable>
              <Pressable style={s.confirmOkBtn} onPress={handleExecuteConfirmedAction}>
                <Text style={s.confirmOkText}>{esES ? 'CONFIRMAR' : 'CONFIRM'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // ─── Usuarios Registrados ─────────────────────────────────────────────────
  const renderUsuarios = () => (
    <View style={s.sectionContent}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={s.sectionHeading}>{esES ? 'Usuarios Registrados' : 'Registered Users'}</Text>
        <Pressable
          style={[s.reqBtn, { backgroundColor: 'rgba(160,120,64,0.12)', borderColor: 'rgba(160,120,64,0.3)', marginTop: 4 }]}
          onPress={cargarAdminData}
        >
          <Feather name="refresh-cw" size={12} color={T.gold} style={{ marginRight: 5 }} />
          <Text style={[s.reqBtnText, { color: T.gold }]}>{esES ? 'ACTUALIZAR' : 'REFRESH'}</Text>
        </Pressable>
      </View>
      <Text style={s.sectionDesc}>
        {esES
          ? `${usersList.length} cuenta(s) encontradas. Puedes editar datos o eliminar cuentas (requiere contraseña de admin). Los nuevos usuarios aparecen aquí al iniciar sesión.`
          : `${usersList.length} account(s) found. You can edit data or delete accounts (requires admin password). New users appear here on login.`}
      </Text>

      {loadingAdmin ? (
        <ActivityIndicator size="large" color={T.gold} style={{ marginTop: 40 }} />
      ) : usersList.length === 0 ? (
        <Text style={s.emptyText}>{esES ? 'No hay usuarios registrados.' : 'No registered users.'}</Text>
      ) : (
        usersList.map(u => (
          <View key={u.id} style={s.userCard}>
            {editingUser === u.id ? (
              /* ── Edit Form ── */
              <View style={{ flex: 1, gap: 10 }}>
                <Text style={s.userName}>{esES ? 'Editando usuario' : 'Editing user'}</Text>
                <TextInput
                  style={s.fieldInput}
                  value={editNombre}
                  onChangeText={setEditNombre}
                  placeholder={esES ? 'Nombre completo' : 'Full name'}
                  placeholderTextColor="rgba(242,237,229,0.3)"
                />
                <TextInput
                  style={s.fieldInput}
                  value={editTelefono}
                  onChangeText={setEditTelefono}
                  placeholder={esES ? 'Teléfono' : 'Phone'}
                  placeholderTextColor="rgba(242,237,229,0.3)"
                  keyboardType="phone-pad"
                />
                <TextInput
                  style={s.fieldInput}
                  value={editTipo}
                  onChangeText={setEditTipo}
                  placeholder={esES ? 'Tipo de cliente' : 'Client type'}
                  placeholderTextColor="rgba(242,237,229,0.3)"
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    style={[s.reqBtn, { backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', flex: 1 }]}
                    onPress={() => triggerActionConfirm('save_user', { id: u.id })}
                  >
                    <Feather name="save" size={13} color="#22C55E" style={{ marginRight: 5 }} />
                    <Text style={[s.reqBtnText, { color: '#22C55E' }]}>{esES ? 'GUARDAR' : 'SAVE'}</Text>
                  </Pressable>
                  <Pressable
                    style={[s.reqBtn, { borderColor: T.border, flex: 1 }]}
                    onPress={() => setEditingUser(null)}
                  >
                    <Feather name="x" size={13} color={T.textSub} style={{ marginRight: 5 }} />
                    <Text style={[s.reqBtnText, { color: T.textSub }]}>{esES ? 'CANCELAR' : 'CANCEL'}</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* ── User Row ── */
              <>
                <View style={s.userCardAvatar}>
                  <Text style={s.userCardInitials}>
                    {(u.full_name || u.email || '?').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.userName}>{u.full_name || (esES ? 'Sin nombre' : 'No name')}</Text>
                  <Text style={s.userEmail}>{u.email}</Text>
                  {u.phone ? <Text style={s.userMeta}>📞 {u.phone}</Text> : null}
                  {u.tipo_cliente ? <Text style={s.userMeta}>👤 {u.tipo_cliente}</Text> : null}
                  {u.inmoviralPlus && (
                    <Text style={[s.userMeta, { color: '#E0A96D', fontWeight: 'bold' }]}>✨ InmoViral Plus Activo</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    {u.provider === 'google' && (
                      <View style={s.providerBadge}>
                        <Text style={s.providerBadgeText}>🔵 Google</Text>
                      </View>
                    )}
                    {(!u.provider || u.provider === 'email') && (
                      <View style={[s.providerBadge, { borderColor: 'rgba(160,120,64,0.3)', backgroundColor: 'rgba(160,120,64,0.08)' }]}>
                        <Text style={[s.providerBadgeText, { color: T.gold }]}>✉ Email</Text>
                      </View>
                    )}
                    {u.registered_at ? <Text style={s.userMeta}>📅 {new Date(u.registered_at).toLocaleDateString()}</Text> : null}
                  </View>
                </View>
                <View style={{ gap: 6 }}>
                  <Pressable
                    style={[s.reqBtn, { backgroundColor: u.inmoviralPlus ? 'rgba(220,38,38,0.15)' : 'rgba(160,120,64,0.15)', borderColor: u.inmoviralPlus ? 'rgba(220,38,38,0.4)' : 'rgba(160,120,64,0.4)' }]}
                    onPress={() => triggerActionConfirm('toggle_inmoviral_plus', { userId: u.id })}
                  >
                    <Feather name={u.inmoviralPlus ? 'x-circle' : 'star'} size={13} color={u.inmoviralPlus ? '#DC2626' : T.gold} style={{ marginRight: 5 }} />
                    <Text style={[s.reqBtnText, { color: u.inmoviralPlus ? '#DC2626' : T.gold }]}>
                      {u.inmoviralPlus ? (esES ? 'QUITAR PLUS' : 'REMOVE PLUS') : (esES ? 'DAR PLUS' : 'GIVE PLUS')}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[s.reqBtn, { backgroundColor: 'rgba(160,120,64,0.15)', borderColor: 'rgba(160,120,64,0.4)' }]}
                    onPress={() => {
                      setEditingUser(u.id);
                      setEditNombre(u.full_name || '');
                      setEditTelefono(u.phone || '');
                      setEditTipo(u.tipo_cliente || '');
                    }}
                  >
                    <Feather name="edit-2" size={13} color={T.gold} style={{ marginRight: 5 }} />
                    <Text style={[s.reqBtnText, { color: T.gold }]}>{esES ? 'EDITAR' : 'EDIT'}</Text>
                  </Pressable>
                  <Pressable
                    style={[s.reqBtn, { backgroundColor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.4)' }]}
                    onPress={() => triggerActionConfirm('delete_user', { id: u.id })}
                  >
                    <Feather name="trash-2" size={13} color="#DC2626" style={{ marginRight: 5 }} />
                    <Text style={[s.reqBtnText, { color: '#DC2626' }]}>{esES ? 'ELIMINAR' : 'DELETE'}</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        ))
      )}

      {/* Admin password confirm modal */}
      {actionConfirmVisible && (
        <View style={s.confirmOverlay}>
          <View style={s.confirmBox}>
            <Text style={s.confirmTitle}>{esES ? '🔐 Confirmación Admin' : '🔐 Admin Confirmation'}</Text>
            <Text style={s.confirmDesc}>
              {esES ? 'Ingresa la contraseña de administrador para continuar.' : 'Enter the admin password to continue.'}
            </Text>
            <TextInput
              style={s.confirmInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder={esES ? 'Contraseña de admin' : 'Admin password'}
              placeholderTextColor="rgba(242,237,229,0.3)"
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable style={s.confirmCancelBtn} onPress={() => setActionConfirmVisible(false)}>
                <Text style={s.confirmCancelText}>{esES ? 'Cancelar' : 'Cancel'}</Text>
              </Pressable>
              <Pressable style={s.confirmOkBtn} onPress={handleExecuteConfirmedAction}>
                <Text style={s.confirmOkText}>{esES ? 'CONFIRMAR' : 'CONFIRM'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderInmoViralPlus = () => {
    const plusUsers = usersList.filter(u => u.inmoviralPlus === true);

    return (
      <View style={s.sectionContent}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={s.sectionHeading}>InmoViral Plus</Text>
          <Pressable
            style={[s.reqBtn, { backgroundColor: 'rgba(160,120,64,0.12)', borderColor: 'rgba(160,120,64,0.3)', marginTop: 4 }]}
            onPress={cargarAdminData}
          >
            <Feather name="refresh-cw" size={12} color={T.gold} style={{ marginRight: 5 }} />
            <Text style={[s.reqBtnText, { color: T.gold }]}>{esES ? 'ACTUALIZAR' : 'REFRESH'}</Text>
          </Pressable>
        </View>
        <Text style={s.sectionDesc}>
          {esES
            ? `Usuarios con suscripción activa a InmoViral Plus ($150 MXN/mes). Tienen sus casas destacadas en la pantalla de inicio y con corona en el mapa.`
            : `Users with active subscription to InmoViral Plus ($150 MXN/month). Their properties appear featured on homepage and highlighted on the map.`}
        </Text>

        {loadingAdmin ? (
          <ActivityIndicator size="large" color={T.gold} style={{ marginTop: 40 }} />
        ) : plusUsers.length === 0 ? (
          <Text style={s.emptyText}>{esES ? 'No hay usuarios suscritos a InmoViral Plus.' : 'No users subscribed to InmoViral Plus.'}</Text>
        ) : (
          plusUsers.map(u => (
            <View key={u.id} style={s.userCard}>
              <View style={s.userCardAvatar}>
                <Text style={s.userCardInitials}>
                  {(u.full_name || u.email || '?').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.userName}>{u.full_name || (esES ? 'Sin nombre' : 'No name')}</Text>
                <Text style={s.userEmail}>{u.email}</Text>
                {u.phone ? <Text style={s.userMeta}>📞 {u.phone}</Text> : null}
                <Text style={[s.userMeta, { color: '#E0A96D', fontWeight: 'bold' }]}>✨ InmoViral Plus Activo</Text>
              </View>
              <View style={{ gap: 6 }}>
                <Pressable
                  style={[s.reqBtn, { backgroundColor: 'rgba(220,38,38,0.15)', borderColor: 'rgba(220,38,38,0.4)' }]}
                  onPress={() => triggerActionConfirm('toggle_inmoviral_plus', { userId: u.id })}
                >
                  <Feather name="x-circle" size={13} color="#DC2626" style={{ marginRight: 5 }} />
                  <Text style={[s.reqBtnText, { color: '#DC2626' }]}>
                    {esES ? 'QUITAR PLUS' : 'REMOVE PLUS'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </View>
    );
  };

  const sidebarItems = [
    { id: 'datos', icon: 'user', label: esES ? 'Datos' : 'Data' },
    { id: 'password', icon: 'lock', label: esES ? 'Cambiar contraseña' : 'Change password' },
    { id: 'delete', icon: 'trash-2', label: esES ? 'Eliminar cuenta' : 'Delete account' },
  ];
  if (isAdmin) {
    sidebarItems.push({ id: 'moderadores', icon: 'users', label: esES ? 'Moderadores' : 'Moderators' });
    sidebarItems.push({ id: 'usuarios', icon: 'shield', label: esES ? 'Usuarios Registrados' : 'Registered Users' });
    sidebarItems.push({ id: 'inmoviralplus', icon: 'star', label: 'InmoViral Plus' });
  }

  return (
    <ScrollView style={s.page} contentContainerStyle={s.pageContent}>
      <View style={[s.pageHeader, !isWide && { paddingTop: 20 }]}>
        <Text style={s.pageTitle}>{t('profile.page_title')}</Text>
      </View>

      {feedback !== '' && (
        <View style={s.feedbackBar}>
          <Text style={s.feedbackText}>{feedback}</Text>
        </View>
      )}

      <View style={[s.mainLayout, { flexDirection: isWide ? 'row' : 'column' }]}>
        {/* Sidebar */}
        <View style={[s.sidebar, { width: isWide ? 280 : '100%', marginBottom: isWide ? 0 : 24 }]}>
          {sidebarItems.map(item => (
            <SidebarItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              isActive={activeSection === item.id}
              onPress={() => setActiveSection(item.id)}
            />
          ))}
        </View>

        {/* Content */}
        <View style={[s.contentPanel, { flex: isWide ? 1 : undefined }]}>
          {activeSection === 'datos' && renderDatos()}
          {activeSection === 'password' && renderPassword()}
          {activeSection === 'delete' && renderDeleteAccount()}
          {activeSection === 'moderadores' && isAdmin && renderModeradores()}
          {activeSection === 'usuarios' && isAdmin && renderUsuarios()}
          {activeSection === 'inmoviralplus' && isAdmin && renderInmoViralPlus()}
        </View>
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

  mainLayout: { padding: 32, maxWidth: 1000, alignSelf: 'center', width: '100%', gap: 32 },

  sidebar: {
    backgroundColor: T.bgAlt,
    borderWidth: 1,
    borderColor: T.border,
    paddingVertical: 8,
  },
  sideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...Platform.select({ web: { cursor: 'pointer', transition: 'background-color 0.15s ease' }, default: {} }),
  },
  sideItemActive: { borderLeftColor: T.gold, backgroundColor: 'rgba(160,120,64,0.06)' },
  sideItemHover: { backgroundColor: 'rgba(255,255,255,0.03)' },
  sideItemText: { color: T.textSub, fontSize: 13, fontFamily: T.sans, fontWeight: '500' },

  contentPanel: {
    backgroundColor: T.bgAlt,
    borderWidth: 1,
    borderColor: T.border,
    padding: 36,
  },
  sectionContent: {},
  sectionHeading: { color: T.text, fontSize: 22, fontFamily: T.serif, marginBottom: 8 },
  sectionDesc: { color: T.textSub, fontSize: 12, fontFamily: T.sans, lineHeight: 18, marginBottom: 28 },

  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 32 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40 },
  avatarLargePlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.gold,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(160,120,64,0.4)',
  },
  avatarLargeInitials: { color: '#FFF', fontSize: 26, fontWeight: '600' },
  avatarActions: { gap: 10 },
  avatarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, paddingHorizontal: 16,
    borderWidth: 1, borderColor: T.border,
  },
  avatarBtnText: { color: T.gold, fontSize: 11, fontFamily: T.sans, letterSpacing: 1 },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: { color: T.gold, fontSize: 10, fontFamily: T.sans, letterSpacing: 2, fontWeight: '500', marginBottom: 8 },
  fieldInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: T.borderGold,
    color: T.text,
    fontFamily: T.sans,
    fontSize: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  fieldReadonly: { backgroundColor: 'rgba(255,255,255,0.02)', borderColor: T.border },
  fieldReadonlyText: { color: T.textSub, fontSize: 14, fontFamily: T.sans },

  saveBtn: {
    backgroundColor: T.gold,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 24,
    alignSelf: 'flex-start',
  },
  saveBtnText: { color: '#000', fontSize: 11, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.danger,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  deleteBtnText: { color: '#FFF', fontSize: 11, fontFamily: T.sans, fontWeight: '600', letterSpacing: 2 },

  backBtn: {
    alignSelf: 'center',
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  backBtnText: { color: T.textSub, fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: '500' },
  userCard: {
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    borderRadius: 4,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userNameText: {
    color: T.text,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: T.sans,
  },
  userDetailText: {
    color: T.textSub,
    fontSize: 12,
    fontFamily: T.sans,
  },
  userBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBtnEdit: {
    backgroundColor: T.gold,
  },
  userBtnDelete: {
    backgroundColor: T.danger,
  },
  userBtnSave: {
    backgroundColor: T.gold,
  },
  userBtnCancel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userBtnAddMod: {
    backgroundColor: T.gold,
  },
  userBtnRemoveMod: {
    borderWidth: 1,
    borderColor: T.danger,
  },
  userBtnText: {
    color: '#000',
    fontSize: 11,
    fontFamily: T.sans,
    fontWeight: '600',
  },
  requestCard: {
    backgroundColor: T.bgCard,
    borderWidth: 1,
    borderColor: T.border,
    padding: 16,
    borderRadius: 4,
    marginBottom: 12,
  },
  requestTitleText: {
    color: T.text,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: T.sans,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: '#A07840',
    padding: 24,
    borderRadius: 4,
  },
  modalTitle: {
    color: '#A07840',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 12,
    fontFamily: T.sans,
    textTransform: 'uppercase',
  },
  modalText: {
    color: '#8A8A84',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
    fontFamily: T.sans,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    color: '#F5F5F0',
    padding: 12,
    marginBottom: 18,
    fontSize: 13,
    fontFamily: T.sans,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 2,
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnCancelText: {
    color: '#8A8A84',
    fontSize: 11.5,
    fontFamily: T.sans,
    fontWeight: '600',
  },
  modalBtnConfirm: {
    backgroundColor: '#A07840',
  },
  modalBtnConfirmText: {
    color: '#000',
    fontSize: 11.5,
    fontFamily: T.sans,
    fontWeight: '600',
  },

  // ── User card styles ────────────────────────────────────────
  userCardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: T.gold,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  userCardInitials: { color: '#000', fontSize: 14, fontWeight: '700', fontFamily: T.sans },
  userName: { color: T.text, fontSize: 14, fontWeight: '600', fontFamily: T.sans },
  userEmail: { color: T.textSub, fontSize: 11, fontFamily: T.sans, marginTop: 2 },
  userMeta: { color: T.gold, fontSize: 10, fontFamily: T.sans, marginTop: 3, letterSpacing: 0.5 },
  emptyText: { color: T.textSub, fontSize: 13, fontFamily: T.sans, textAlign: 'center', marginTop: 40 },

  // ── Moderator toggle ─────────────────────────────────────────
  modToggleBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 10,
    borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)',
    backgroundColor: 'rgba(160,120,64,0.1)',
  },
  modToggleBtnActive: {
    borderColor: 'rgba(220,38,38,0.4)',
    backgroundColor: 'rgba(220,38,38,0.1)',
  },
  modToggleText: { color: T.gold, fontSize: 10, fontFamily: T.sans, fontWeight: '700', letterSpacing: 1 },

  // ── Request section ──────────────────────────────────────────
  reqSection: {
    backgroundColor: 'rgba(160,120,64,0.06)',
    borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)',
    padding: 16, marginBottom: 24,
  },
  reqSectionTitle: { color: T.gold, fontSize: 11, fontFamily: T.sans, fontWeight: '700', letterSpacing: 1.5, marginBottom: 14 },
  reqCard: {
    backgroundColor: T.bgCard,
    borderWidth: 1, borderColor: T.border,
    padding: 14, marginBottom: 10,
  },
  reqCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  reqAction: { color: T.text, fontSize: 12, fontFamily: T.sans, fontWeight: '600', flex: 1 },
  reqStatus: {
    color: '#F59E0B', fontSize: 9, fontFamily: T.sans, fontWeight: '700',
    letterSpacing: 1, backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: 6, paddingVertical: 2,
  },
  reqReason: { color: T.textSub, fontSize: 11, fontFamily: T.sans, lineHeight: 16, marginBottom: 4 },
  reqMeta: { color: T.textSub, fontSize: 10, fontFamily: T.sans, opacity: 0.7, marginBottom: 2 },
  reqActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  reqBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 6, paddingHorizontal: 10,
    borderWidth: 1, borderColor: T.border,
  },
  reqBtnText: { fontSize: 9, fontFamily: T.sans, fontWeight: '700', letterSpacing: 1 },

  // ── Admin confirm modal ──────────────────────────────────────
  confirmOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center',
    zIndex: 1000,
  },
  confirmBox: {
    backgroundColor: '#111110',
    borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)',
    padding: 28, maxWidth: 380, width: '90%',
  },
  confirmTitle: { color: T.gold, fontSize: 14, fontFamily: T.sans, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  confirmDesc: { color: T.textSub, fontSize: 12, fontFamily: T.sans, lineHeight: 18, marginBottom: 16 },
  confirmInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)',
    color: T.text, fontSize: 14, fontFamily: T.sans,
    paddingVertical: 12, paddingHorizontal: 14,
  },
  confirmCancelBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: T.border,
  },
  confirmCancelText: { color: T.textSub, fontSize: 11, fontFamily: T.sans, fontWeight: '600' },
  confirmOkBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    backgroundColor: T.gold,
  },
  confirmOkText: { color: '#000', fontSize: 11, fontFamily: T.sans, fontWeight: '700', letterSpacing: 1 },

  // ── Provider badge ───────────────────────────────────────────
  providerBadge: {
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
    backgroundColor: 'rgba(59,130,246,0.08)',
  },
  providerBadgeText: { color: '#60A5FA', fontSize: 9, fontFamily: T.sans, fontWeight: '600', letterSpacing: 0.5 },
  
  // ── Plus subscription badge ─────────────────────────────────
  plusBadgeContainer: {
    backgroundColor: 'rgba(160, 120, 64, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.3)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderRadius: 2,
    width: '100%',
  },
  plusBadgeText: {
    color: T.gold,
    fontSize: 11,
    fontFamily: T.sans,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cancelSubBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  cancelSubBtnText: {
    color: '#DC2626',
    fontSize: 9,
    fontFamily: T.sans,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
