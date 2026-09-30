import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import { FontAwesome } from '@expo/vector-icons';
import { fetchModerators } from './systemSync';

const T = {
  gold:      '#A07840',
  goldHover: '#C39B5F',
  bg:        '#0A0A0A',
  bgAlt:     '#111110',
  text:      '#F5F5F0',
  muted:     '#8A8A84',
  border:    'rgba(255,255,255,0.08)',
  borderMid: 'rgba(255,255,255,0.25)',
  serif:     Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans:      Platform.select({ ios: 'System',  android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

export default function Dashboard({ activeTab, setActiveTab, onPublicar, onEditarPropiedad, onVolver }) {
  const { t, i18n } = useTranslation();
  const { user, updateUserMetadata } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width > 1024;
  const esES = i18n.language.startsWith('es');

  const [loading, setLoading] = useState(true);
  const [propiedades, setPropiedades] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);

  // Moderator states
  const [isModerator, setIsModerator] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectProp, setRejectProp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    const checkMod = async () => {
      if (!user) return;
      try {
        const mods = await fetchModerators();
        setIsModerator(mods.includes(user.id));
      } catch (e) {
        console.error(e);
      }
    };
    checkMod();
  }, [user]);

  // Cargar propiedades creadas por el usuario (o todas si es admin/mod)
  const cargarPropiedades = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isAdmin = user.isAdmin || user.email === 'ventas@inmoviral.com.mx' || user.id === 'admin-id-0000';
      const mods = await fetchModerators();
      const isMod = mods.includes(user.id);
      const esAdminOMod = isAdmin || isMod;

      let query = supabase
        .from('propiedades')
        .select('*')
        .order('created_at', { ascending: false });

      if (!esAdminOMod) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPropiedades(data || []);
    } catch (err) {
      console.error('Error al cargar propiedades del usuario:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSeleccionar = (id) => {
    setSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const seleccionarTodas = () => {
    if (seleccionadas.length === propiedades.length) {
      setSeleccionadas([]);
    } else {
      setSeleccionadas(propiedades.map(p => p.id));
    }
  };

  const handleBorrarSeleccionadas = async () => {
    const eliminarSeleccionadas = async () => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('propiedades')
          .delete()
          .in('id', seleccionadas);

        if (error) throw error;
        
        cargarPropiedades();
        seleccionadas.forEach(id => removerFavoritoLocal(id));
        setSeleccionadas([]);
      } catch (err) {
        console.error('Error al eliminar propiedades:', err);
        if (Platform.OS === 'web') {
          alert(esES ? 'Error al eliminar las propiedades seleccionadas.' : 'Error deleting selected properties.');
        }
      } finally {
        setLoading(false);
      }
    };

    const confirmMsg = esES 
      ? `¿Estás seguro de que deseas eliminar las ${seleccionadas.length} publicaciones seleccionadas? Esta acción no se puede deshacer.`
      : `Are you sure you want to delete the ${seleccionadas.length} selected listings? This action cannot be undone.`;

    if (Platform.OS === 'web') {
      if (window.confirm(confirmMsg)) {
        eliminarSeleccionadas();
      }
    } else {
      Alert.alert(
        esES ? 'Confirmar eliminación' : 'Confirm deletion',
        confirmMsg,
        [
          { text: esES ? 'Cancelar' : 'Cancel', style: 'cancel' },
          { text: esES ? 'Eliminar' : 'Delete', onPress: eliminarSeleccionadas, style: 'destructive' }
        ]
      );
    }
  };

  // Cargar propiedades favoritas (desde user_metadata/localStorage)
  const cargarFavoritos = async () => {
    if (!user) return;
    setLoadingFavs(true);
    try {
      let favIds = user.user_metadata?.favoritos || [];
      if (Platform.OS === 'web' && favIds.length === 0) {
        try {
          const saved = localStorage.getItem(`favoritos_${user.id}`);
          if (saved) {
            favIds = JSON.parse(saved);
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      if (favIds.length > 0) {
        const { data, error } = await supabase
          .from('propiedades')
          .select('*')
          .in('id', favIds);
        
        if (error) throw error;
        setFavoritos(data || []);
      } else {
        setFavoritos([]);
      }
    } catch (err) {
      console.error('Error al cargar favoritos:', err);
    } finally {
      setLoadingFavs(false);
    }
  };

  useEffect(() => {
    cargarPropiedades();
    cargarFavoritos();
  }, [user]);

  // Borrar una propiedad
  const handleBorrar = async (propiedad) => {
    const eliminar = async () => {
      try {
        setLoading(true);
        const { error } = await supabase
          .from('propiedades')
          .delete()
          .eq('id', propiedad.id);

        if (error) throw error;
        
        // Recargar listas
        cargarPropiedades();
        // Quitar de favoritos si estaba
        removerFavoritoLocal(propiedad.id);
      } catch (err) {
        console.error('Error al eliminar propiedad:', err);
        if (Platform.OS === 'web') {
          alert(esES ? 'Error al eliminar la propiedad.' : 'Error deleting property.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmacion = window.confirm(
        esES 
          ? `┬┐Est├ís seguro de que deseas eliminar la publicaci├│n "${propiedad.titulo}"? Esta acci├│n no se puede deshacer.`
          : `Are you sure you want to delete the listing "${propiedad.titulo}"? This action cannot be undone.`
      );
      if (confirmacion) {
        eliminar();
      }
    } else {
      Alert.alert(
        esES ? 'Confirmar eliminaci├│n' : 'Confirm deletion',
        esES 
          ? `┬┐Est├ís seguro de que deseas eliminar la publicaci├│n "${propiedad.titulo}"? Esta acci├│n no se puede deshacer.`
          : `Are you sure you want to delete the listing "${propiedad.titulo}"? This action cannot be undone.`,
        [
          { text: esES ? 'Cancelar' : 'Cancel', style: 'cancel' },
          { text: esES ? 'Eliminar' : 'Delete', onPress: eliminar, style: 'destructive' }
        ]
      );
    }
  };

  // Quitar favorito de la lista local y de user_metadata
  const removerFavoritoLocal = async (id) => {
    if (!user) return;
    try {
      let favIds = user.user_metadata?.favoritos || [];
      if (Platform.OS === 'web' && favIds.length === 0) {
        try {
          const saved = localStorage.getItem(`favoritos_${user.id}`);
          if (saved) {
            favIds = JSON.parse(saved);
          }
        } catch (e) {
          console.error(e);
        }
      }
      const updated = favIds.filter(favId => favId !== id);
      
      await updateUserMetadata({ favoritos: updated });

      if (Platform.OS === 'web') {
        try {
          localStorage.setItem(`favoritos_${user.id}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      setFavoritos(prev => prev.filter(f => f.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAprobar = async (prop) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('propiedades')
        .update({ estatus: 'Disponible' })
        .eq('id', prop.id);
      
      if (error) throw error;
      
      await cargarPropiedades();
      
      if (Platform.OS === 'web') {
        alert(esES ? 'Propiedad aprobada y publicada exitosamente.' : 'Property approved and published successfully.');
      } else {
        Alert.alert(
          esES ? 'Éxito' : 'Success',
          esES ? 'Propiedad aprobada y publicada exitosamente.' : 'Property approved and published successfully.'
        );
      }
    } catch (err) {
      console.error(err);
      alert(esES ? 'Error al aprobar la propiedad.' : 'Error approving property.');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazar = (prop) => {
    setRejectProp(prop);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const confirmRechazo = async () => {
    if (!rejectReason.trim()) {
      alert(esES ? 'Por favor ingresa un motivo para el rechazo.' : 'Please enter a reason for the rejection.');
      return;
    }
    if (!rejectProp) return;
    
    try {
      setLoading(true);
      const formattedStatus = `rechazada|${rejectReason.trim()}`;
      const { error } = await supabase
        .from('propiedades')
        .update({ estatus: formattedStatus })
        .eq('id', rejectProp.id);
      
      if (error) throw error;
      
      setShowRejectModal(false);
      setRejectProp(null);
      setRejectReason('');
      
      await cargarPropiedades();
      
      if (Platform.OS === 'web') {
        alert(esES ? 'Propiedad rechazada exitosamente.' : 'Property successfully rejected.');
      } else {
        Alert.alert(
          esES ? 'Éxito' : 'Success',
          esES ? 'Propiedad rechazada exitosamente.' : 'Property successfully rejected.'
        );
      }
    } catch (err) {
      console.error(err);
      alert(esES ? 'Error al rechazar la propiedad.' : 'Error rejecting property.');
    } finally {
      setLoading(false);
    }
  };

  const renderPendientesDePublicar = () => {
    const pendingList = propiedades.filter(p => p.estatus === 'pendiente');

    return (
      <View style={S.tabContent}>
        <Text style={S.sectionHeading}>
          {esES ? 'Propiedades Pendientes de Publicar' : 'Pending Listings'} ({pendingList.length})
        </Text>

        {pendingList.length === 0 ? (
          <View style={S.emptyBox}>
            <FontAwesome name="check-circle" size={48} color={T.gold} style={{ marginBottom: 16 }} />
            <Text style={S.emptyText}>
              {esES ? 'No hay propiedades pendientes de aprobación.' : 'No pending listings for approval.'}
            </Text>
          </View>
        ) : (
          <View style={S.propertiesList}>
            {pendingList.map(prop => (
              <View key={prop.id} style={[S.propCard, { flexDirection: width > 640 ? 'row' : 'column', alignItems: 'center' }]}>
                <Image 
                  source={{ uri: prop.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} 
                  style={S.propImage}
                  resizeMode="cover"
                />
                <View style={[S.propInfo, { flex: 1 }]}>
                  <View style={S.propHeaderRow}>
                    <Text style={S.propTag}>{prop.operacion?.toUpperCase()}</Text>
                    <Text style={[S.propStatusTag, { borderColor: '#EAB308', color: '#EAB308' }]}>
                      {esES ? 'PENDIENTE' : 'PENDING'}
                    </Text>
                  </View>
                  <Text style={S.propTitle} numberOfLines={1}>{prop.titulo}</Text>
                  <Text style={S.propPrice}>${parseFloat(prop.precio || prop.price || 0).toLocaleString()} MXN</Text>
                  <Text style={S.propLoc} numberOfLines={1}>📍 {prop.ubicacion}</Text>
                  
                  <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', paddingTop: 8 }}>
                    <Text style={{ color: '#8A8A84', fontSize: 11, fontFamily: T.sans }}>
                      {esES ? 'Contacto: ' : 'Contact: '}<Text style={{ color: '#fff', fontWeight: 'bold' }}>{prop.nombre_contacto}</Text> ({prop.email_contacto || 'Sin email'})
                    </Text>
                    <Text style={{ color: '#8A8A84', fontSize: 11, fontFamily: T.sans, marginTop: 2 }}>
                      {esES ? 'Teléfono: ' : 'Phone: '}<Text style={{ color: '#fff' }}>{prop.telefono_contacto || 'Sin teléfono'}</Text>
                    </Text>
                  </View>
                </View>

                <View style={[S.propActions, { flexDirection: width > 640 ? 'column' : 'row', gap: 10, width: width > 640 ? undefined : '100%', borderLeftWidth: width > 640 ? 1 : 0, borderTopWidth: width > 640 ? 0 : 1 }]}>
                  <Pressable 
                    style={[S.actionBtnEdit, { backgroundColor: T.gold, borderColor: T.gold }]} 
                    onPress={() => handleAprobar(prop)}
                  >
                    <FontAwesome name="check" size={14} color="#000" style={{ marginRight: 6 }} />
                    <Text style={[S.actionBtnText, { color: '#000', fontWeight: 'bold' }]}>{esES ? 'Aprobar' : 'Approve'}</Text>
                  </Pressable>
                  <Pressable 
                    style={[S.actionBtnDelete, { backgroundColor: '#EF4444', borderColor: '#EF4444' }]} 
                    onPress={() => handleRechazar(prop)}
                  >
                    <FontAwesome name="times" size={14} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={[S.actionBtnText, { color: '#fff', fontWeight: 'bold' }]}>{esES ? 'Rechazar' : 'Reject'}</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Renderizar pestañas superiores del panel
  const renderTabs = () => {
    const isAdmin = user?.isAdmin || user?.email === 'ventas@inmoviral.com.mx' || user?.id === 'admin-id-0000';
    const esAdminOMod = isAdmin || isModerator;

    const tabs = [
      { id: 'dashboard', label: esES ? 'Dashboard' : 'Dashboard', icon: 'bar-chart' },
      { id: 'publicaciones', label: esAdminOMod ? (esES ? 'Todas las publicaciones' : 'All listings') : (esES ? 'Mis publicaciones' : 'My listings'), icon: 'pencil-square-o' },
    ];
    
    if (esAdminOMod) {
      tabs.push({ id: 'pendientes', label: esES ? 'Pendientes de publicar' : 'Pendientes de publicar', icon: 'hourglass-start' });
    }
    
    tabs.push({ id: 'guardadas', label: esES ? 'Favoritos' : 'Saved', icon: 'heart-o' });

    return (
      <View style={S.tabBar}>
        {tabs.map(tab => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[S.tabButton, activeTab === tab.id && S.tabButtonActive]}
          >
            <FontAwesome 
              name={tab.icon} 
              size={14} 
              color={activeTab === tab.id ? '#000' : T.muted} 
              style={{ marginRight: 8 }}
            />
            <Text style={[S.tabButtonText, activeTab === tab.id && S.tabButtonTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  };

  // Renderizado Pesta├▒a 1: Dashboard
  const renderDashboard = () => {
    const totalPublicaciones = propiedades.length;
    // M├®trica simulada de visualizaciones y leads
    const visualizaciones = totalPublicaciones * 45 + 12;
    const leads = totalPublicaciones * 3 + 2;

    return (
      <View style={S.tabContent}>
        <View style={S.welcomeBox}>
          <Text style={S.welcomeTitle}>
            {esES ? 'Panel de Control' : 'Control Panel'}
          </Text>
          <Text style={S.welcomeSubtitle}>
            {esES 
              ? 'Gestiona tus propiedades publicadas, revisa tus estad├¡sticas y actualiza tu portafolio exclusivo.'
              : 'Manage your listed properties, review your statistics and update your exclusive portfolio.'}
          </Text>
        </View>

        <View style={[S.statsGrid, { flexDirection: isWide ? 'row' : 'column' }]}>
          <View style={S.statCard}>
            <Text style={S.statVal}>{totalPublicaciones}</Text>
            <Text style={S.statLabel}>{esES ? 'Publicaciones Totales' : 'Total Listings'}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{visualizaciones}</Text>
            <Text style={S.statLabel}>{esES ? 'Visualizaciones estimadas' : 'Estimated Views'}</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{leads}</Text>
            <Text style={S.statLabel}>{esES ? 'Prospectos / Leads' : 'Leads'}</Text>
          </View>
        </View>

        <View style={S.dashboardActions}>
          <Pressable style={S.btnGold} onPress={onPublicar}>
            <FontAwesome name="plus" size={12} color="#000" style={{ marginRight: 8 }} />
            <Text style={S.btnGoldText}>
              {esES ? 'PUBLICAR NUEVA PROPIEDAD' : 'PUBLISH NEW PROPERTY'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  // Renderizado Pestaña 2: Mis publicaciones
  const renderMisPublicaciones = () => {
    const isAdmin = user?.isAdmin || user?.email === 'ventas@inmoviral.com.mx' || user?.id === 'admin-id-0000';
    if (loading) {
      return (
        <View style={S.centerLoader}>
          <ActivityIndicator color={T.gold} size="large" />
        </View>
      );
    }

    if (propiedades.length === 0) {
      return (
        <View style={S.emptyBox}>
          <Text style={S.emptyText}>
            {esES ? 'No tienes ninguna propiedad publicada.' : 'You have no published properties.'}
          </Text>
          <Pressable style={[S.btnGold, { marginTop: 20 }]} onPress={onPublicar}>
            <Text style={S.btnGoldText}>{esES ? 'PUBLICAR AHORA' : 'PUBLISH NOW'}</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={S.tabContent}>
        <Text style={S.sectionHeading}>
          {isAdmin ? (esES ? 'Todas las Propiedades' : 'All Properties') : (esES ? 'Tus Propiedades' : 'Your Properties')} ({propiedades.length})
        </Text>

        {propiedades.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#181614', padding: 12, borderRadius: 4, marginBottom: 12, borderWidth: 1, borderColor: T.border }}>
            <TouchableOpacity onPress={seleccionarTodas} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <FontAwesome 
                name={seleccionadas.length === propiedades.length ? "check-square-o" : "square-o"} 
                size={16} 
                color={T.gold} 
              />
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600', fontFamily: T.sans }}>
                {seleccionadas.length === propiedades.length 
                  ? (esES ? 'DESELECCIONAR TODAS' : 'DESELECT ALL') 
                  : (esES ? 'SELECCIONAR TODAS' : 'SELECT ALL')}
              </Text>
            </TouchableOpacity>

            {seleccionadas.length > 0 && (
              <TouchableOpacity onPress={handleBorrarSeleccionadas} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff707015', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: '#ff707030' }}>
                <FontAwesome name="trash" size={12} color="#ff7070" />
                <Text style={{ color: '#ff7070', fontSize: 10, fontWeight: '700', fontFamily: T.sans }}>
                  {esES ? `ELIMINAR SELECCIONADAS (${seleccionadas.length})` : `DELETE SELECTED (${seleccionadas.length})`}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        
        <View style={S.propertiesList}>
          {propiedades.map(p => {
            const isSelected = seleccionadas.includes(p.id);
            return (
              <View key={p.id} style={[S.propCard, { flexDirection: width > 640 ? 'row' : 'column', alignItems: 'center' }]}>
                {/* Checkbox de selección */}
                <TouchableOpacity onPress={() => toggleSeleccionar(p.id)} style={{ padding: 12 }}>
                  <FontAwesome 
                    name={isSelected ? "check-square-o" : "square-o"} 
                    size={20} 
                    color={isSelected ? T.gold : '#555'} 
                  />
                </TouchableOpacity>

                <Image 
                  source={{ uri: p.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} 
                  style={S.propImage}
                  resizeMode="cover"
                />
                <View style={[S.propInfo, { flex: 1 }]}>
                  <View style={S.propHeaderRow}>
                    <Text style={S.propTag}>{p.operacion?.toUpperCase()}</Text>
                    <Text style={S.propStatusTag}>{p.estatus || 'pendiente'}</Text>
                  </View>
                  <Text style={S.propTitle} numberOfLines={1}>{p.titulo}</Text>
                  <Text style={S.propPrice}>${parseFloat(p.price || p.precio || 0).toLocaleString()} MXN</Text>
                  <Text style={S.propLoc} numberOfLines={1}>­ƒôì {p.ubicacion}</Text>
                </View>

                <View style={[S.propActions, { flexDirection: width > 640 ? 'column' : 'row' }]}>
                  <Pressable style={S.actionBtnEdit} onPress={() => onEditarPropiedad(p)}>
                    <FontAwesome name="edit" size={14} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={S.actionBtnText}>{esES ? 'Editar' : 'Edit'}</Text>
                  </Pressable>
                  <Pressable style={S.actionBtnDelete} onPress={() => handleBorrar(p)}>
                    <FontAwesome name="trash" size={14} color="#ff7070" style={{ marginRight: 6 }} />
                    <Text style={[S.actionBtnText, { color: '#ff7070' }]}>{esES ? 'Eliminar' : 'Delete'}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Renderizado Pesta├▒a 3: Guardadas / Favoritos
  const renderGuardadas = () => {
    if (loadingFavs) {
      return (
        <View style={S.centerLoader}>
          <ActivityIndicator color={T.gold} size="large" />
        </View>
      );
    }

    if (favoritos.length === 0) {
      return (
        <View style={S.emptyBox}>
          <Text style={S.emptyText}>
            {esES ? 'No tienes propiedades guardadas.' : 'You have no saved properties.'}
          </Text>
        </View>
      );
    }

    return (
      <View style={S.tabContent}>
        <Text style={S.sectionHeading}>
          {esES ? 'Propiedades Guardadas' : 'Saved Properties'} ({favoritos.length})
        </Text>
        
        <View style={S.propertiesList}>
          {favoritos.map(p => (
            <View key={p.id} style={[S.propCard, { flexDirection: width > 640 ? 'row' : 'column' }]}>
              <Image 
                source={{ uri: p.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} 
                style={S.propImage}
                resizeMode="cover"
              />
              <View style={S.propInfo}>
                <View style={S.propHeaderRow}>
                  <Text style={S.propTag}>{p.operacion?.toUpperCase()}</Text>
                </View>
                <Text style={S.propTitle} numberOfLines={1}>{p.titulo}</Text>
                <Text style={S.propPrice}>${parseFloat(p.price || p.precio || 0).toLocaleString()} MXN</Text>
                <Text style={S.propLoc} numberOfLines={1}>­ƒôì {p.ubicacion}</Text>
              </View>

              <View style={[S.propActions, { flexDirection: width > 640 ? 'column' : 'row', justifyContent: 'center' }]}>
                <Pressable style={S.actionBtnDelete} onPress={() => removerFavoritoLocal(p.id)}>
                  <FontAwesome name="heart" size={14} color={T.gold} style={{ marginRight: 6 }} />
                  <Text style={[S.actionBtnText, { color: T.gold }]}>{esES ? 'Quitar' : 'Remove'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={S.root} contentContainerStyle={S.container}>
        <View style={S.headerRow}>
          <Pressable onPress={onVolver} style={S.backBtn}>
            <FontAwesome name="chevron-left" size={10} color={T.gold} style={{ marginRight: 8 }} />
            <Text style={S.backBtnText}>{esES ? 'VOLVER AL INICIO' : 'BACK TO HOME'}</Text>
          </Pressable>
        </View>

        {renderTabs()}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'publicaciones' && renderMisPublicaciones()}
        {activeTab === 'pendientes' && renderPendientesDePublicar()}
        {activeTab === 'guardadas' && renderGuardadas()}
      </ScrollView>

      {showRejectModal && (
        <View style={S.modalOverlay}>
          <View style={S.modalContent}>
            <Text style={S.modalTitle}>{esES ? 'RECHAZAR PUBLICACIÓN' : 'REJECT PROPERTY'}</Text>
            <Text style={S.modalText}>
              {esES 
                ? 'Ingresa el motivo por el cual se rechaza esta publicación. Este motivo le aparecerá al vendedor en sus notificaciones.'
                : 'Enter the reason for rejecting this property. This reason will appear to the seller in their notifications.'}
            </Text>
            <TextInput
              style={S.modalInput}
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder={esES ? 'Motivo del rechazo...' : 'Reason for rejection...'}
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={S.modalButtons}>
              <Pressable style={[S.modalBtn, S.modalBtnCancel]} onPress={() => { setShowRejectModal(false); setRejectProp(null); }}>
                <Text style={S.modalBtnCancelText}>{esES ? 'Cancelar' : 'Cancel'}</Text>
              </Pressable>
              <Pressable style={[S.modalBtn, S.modalBtnConfirm, { backgroundColor: '#EF4444' }]} onPress={confirmRechazo}>
                <Text style={[S.modalBtnConfirmText, { color: '#fff' }]}>{esES ? 'Confirmar Rechazo' : 'Confirm Rejection'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  container: { paddingHorizontal: 24, paddingVertical: 40, maxWidth: 1100, alignSelf: 'center', width: '100%' },
  headerRow: { marginBottom: 32 },
  backBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' },
  backBtnText: { color: T.gold, fontSize: 10, letterSpacing: 2, fontFamily: T.sans, fontWeight: '700' },
  
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: T.border, marginBottom: 32, gap: 12, flexWrap: 'wrap' },
  tabButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderColor: 'transparent' },
  tabButtonActive: { borderColor: T.gold, backgroundColor: T.gold, borderBottomWidth: 0 },
  tabButtonText: { color: T.muted, fontFamily: T.sans, fontSize: 13, fontWeight: '500' },
  tabButtonTextActive: { color: '#000', fontWeight: '700' },

  tabContent: { marginTop: 8 },
  welcomeBox: { marginBottom: 32 },
  welcomeTitle: { fontFamily: T.serif, fontSize: 32, color: T.text, fontWeight: '300', marginBottom: 12 },
  welcomeSubtitle: { fontFamily: T.sans, fontSize: 14, color: T.muted, lineHeight: 22, fontWeight: '300' },

  statsGrid: { gap: 16, marginBottom: 32 },
  statCard: { flex: 1, backgroundColor: T.bgAlt, borderWidth: 1, borderColor: T.border, padding: 24, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontFamily: T.serif, fontSize: 40, color: T.gold, marginBottom: 8, fontWeight: '400' },
  statLabel: { fontFamily: T.sans, fontSize: 12, color: T.text, letterSpacing: 1, textTransform: 'uppercase', textAlign: 'center' },

  dashboardActions: { flexDirection: 'row', gap: 16 },
  btnGold: { height: 48, backgroundColor: T.gold, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnGoldText: { color: '#000', fontSize: 11, letterSpacing: 2, fontFamily: T.sans, fontWeight: '700' },

  centerLoader: { paddingVertical: 80, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { backgroundColor: T.bgAlt, borderWidth: 1, borderColor: T.border, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: T.sans, fontSize: 14, color: T.muted, textAlign: 'center' },

  sectionHeading: { fontFamily: T.serif, fontSize: 24, color: T.text, fontWeight: '300', marginBottom: 24 },
  propertiesList: { gap: 16 },
  propCard: { backgroundColor: T.bgAlt, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  propImage: { width: 140, height: 110 },
  propInfo: { flex: 1, padding: 16, justifyContent: 'center' },
  propHeaderRow: { flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' },
  propTag: { fontSize: 9, letterSpacing: 1.5, color: T.gold, fontWeight: '700', fontFamily: T.sans },
  propStatusTag: { fontSize: 9, letterSpacing: 1, color: T.muted, textTransform: 'uppercase', fontFamily: T.sans, borderWidth: 1, borderColor: T.border, paddingHorizontal: 6, paddingVertical: 2 },
  propTitle: { fontFamily: T.serif, fontSize: 18, color: T.text, marginBottom: 4 },
  propPrice: { fontFamily: T.sans, fontSize: 13, color: T.text, fontWeight: '600', marginBottom: 4 },
  propLoc: { fontFamily: T.sans, fontSize: 12, color: T.muted },

  propActions: { padding: 16, justifyContent: 'center', gap: 10, borderLeftWidth: Platform.select({ web: 1, default: 0 }), borderColor: T.border },
  actionBtnEdit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1F1E1B', borderWidth: 1, borderColor: T.border, height: 36, paddingHorizontal: 16 },
  actionBtnDelete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,112,112,0.05)', borderWidth: 1, borderColor: 'rgba(255,112,112,0.2)', height: 36, paddingHorizontal: 16 },
  actionBtnText: { fontFamily: T.sans, fontSize: 12, color: '#FFF', fontWeight: '500' },

  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    ...Platform.select({
      web: { position: 'fixed' },
      default: {}
    })
  },
  modalContent: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.3)',
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderRadius: 4,
  },
  modalTitle: {
    fontFamily: T.serif,
    fontSize: 16,
    color: '#fff',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: T.sans,
    fontSize: 12,
    color: T.muted,
    lineHeight: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.15)',
    color: '#fff',
    fontFamily: T.sans,
    fontSize: 13,
    padding: 12,
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 2,
  },
  modalBtnCancel: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modalBtnCancelText: {
    color: T.muted,
    fontFamily: T.sans,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalBtnConfirm: {
    backgroundColor: T.gold,
  },
  modalBtnConfirmText: {
    color: '#000',
    fontFamily: T.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
