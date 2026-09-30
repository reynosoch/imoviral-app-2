import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  TextInput
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { submitRequest } from './systemSync';

const T = {
  gold: '#A07840',
  goldHover: '#C39B5F',
  darkBg: '#0C0C0C',
  black: '#060606',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.4)',
  sans: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  serif: Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'android' ? 'serif' : 'Georgia, serif',
};

export default function InteractiveMap({ propiedades = [], onSelectProperty, user, onRequireLogin, onDeleteProperty }) {
  const mapRef = useRef(null);
  const [selectedProp, setSelectedProp] = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const { width } = useWindowDimensions();

  const isAdmin = user?.isAdmin || user?.email === 'ventas@inmoviral.com.mx' || user?.id === 'admin-id-0000';
  const isModerator = user?.isModerator || false;
  const isModOrAdmin = isAdmin || isModerator;

  const parseCoordinate = (value) => {
    const parsed = typeof value === 'number' ? value : parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const [reqReason, setReqReason] = useState('');
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);

  const handleDeleteClick = () => {
    if (isModerator && !isAdmin) {
      setReqReason('');
      setApprovalModalVisible(true);
    } else {
      setShowPasswordModal(true);
    }
  };

  const handleSendApprovalRequest = async () => {
    if (!reqReason.trim()) {
      alert('Por favor ingresa una razón.');
      return;
    }
    try {
      await submitRequest({
        id: 'req-' + Date.now(),
        moderatorId: user.id,
        action: 'delete_property',
        targetId: selectedProp.id,
        targetName: selectedProp.titulo,
        message: reqReason,
        status: 'pending'
      });
      setApprovalModalVisible(false);
      setSelectedProp(null);
      alert('Solicitud de eliminación enviada al administrador.');
    } catch (e) {
      console.error(e);
      alert('Error al enviar la solicitud.');
    }
  };

  const confirmDeletion = async () => {
    if (adminPasswordInput !== 'admin') {
      alert('Contraseña incorrecta. No se pudo eliminar la propiedad.');
      return;
    }

    try {
      const { error } = await supabase.from('propiedades').delete().eq('id', selectedProp.id);
      if (error) throw error;
      
      alert('Propiedad eliminada con éxito del mapa y del catálogo.');
      const deletedId = selectedProp.id;
      setShowPasswordModal(false);
      setAdminPasswordInput('');
      setSelectedProp(null);
      if (onDeleteProperty) {
        onDeleteProperty(deletedId);
      }
    } catch (e) {
      alert('Error al eliminar de la base de datos: ' + e.message);
    }
  };

  // Filtrar propiedades con coordenadas válidas antes de pintar marcadores nativos.
  const activeProperties = propiedades
    .map((prop) => {
      const latitude = parseCoordinate(prop.lat);
      const longitude = parseCoordinate(prop.lng);
      return latitude !== null && longitude !== null ? { ...prop, latitude, longitude } : null;
    })
    .filter(Boolean);

  // Calcular región inicial para mostrar todo el mundo (centrado en América)
  const getInitialRegion = () => {
    return {
      latitude: 23.6345,
      longitude: -102.5528,
      latitudeDelta: 60.0,
      longitudeDelta: 80.0,
    };
  };

  const handleMarkerPress = (prop) => {
    setSelectedProp(prop);
    if (mapRef.current && Number.isFinite(prop.latitude) && Number.isFinite(prop.longitude)) {
      mapRef.current.animateToRegion({
        latitude: prop.latitude,
        longitude: prop.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 350);
    }
  };

  // Si se corre en web, este archivo no se bundlerá gracias a .web.jsx, pero por seguridad retornamos null
  if (Platform.OS === 'web') return null;

  if (!user) {
    return (
      <View style={s.lockedMapContainer}>
        <Feather name="lock" size={28} color={T.gold} style={{ marginBottom: 14 }} />
        <Text style={s.lockedMapTitle}>MAPA DE PROPIEDADES EXCLUSIVAS</Text>
        <Text style={s.lockedMapText}>
          Para ver el mapa interactivo y la ubicación de las propiedades disponibles, por favor inicia sesión.
        </Text>
        <TouchableOpacity style={s.lockedMapBtn} onPress={onRequireLogin} activeOpacity={0.8}>
          <Text style={s.lockedMapBtnText}>INICIAR SESIÓN</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={getInitialRegion()}
        onPress={() => setSelectedProp(null)}
        scrollEnabled={isInteractive}
        zoomEnabled={isInteractive}
        rotateEnabled={isInteractive}
        pitchEnabled={isInteractive}
      >
        {activeProperties.map(prop => (
          <Marker
            key={prop.id}
            coordinate={{
              latitude: prop.latitude,
              longitude: prop.longitude
            }}
            onPress={(e) => {
              // Prevenir que el evento bubblee y deseleccione la propiedad inmediatamente
              e.stopPropagation();
              handleMarkerPress(prop);
            }}
          >
            <View style={s.markerContainer}>
              <View style={s.markerBadge}>
                <Text style={s.markerEmoji}>🏠</Text>
              </View>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Overlay de Interacción para evitar Scroll Hijacking en pantallas táctiles */}
      {!isInteractive && (
        <TouchableOpacity style={s.mapOverlay} onPress={() => setIsInteractive(true)} activeOpacity={0.9}>
          <Feather name="map" size={28} color={T.gold} style={{ marginBottom: 12 }} />
          <Text style={s.mapOverlayText}>
            TOCA PARA NAVEGAR EN EL MAPA
          </Text>
        </TouchableOpacity>
      )}

      {/* Tarjeta de Vista Previa Premium */}
      {selectedProp && (
        <View style={[s.previewCard, width > 768 ? s.previewCardWide : s.previewCardMobile]}>
          <TouchableOpacity 
            style={s.closeBtn} 
            onPress={() => setSelectedProp(null)}
            activeOpacity={0.7}
          >
            <Feather name="x" size={16} color={T.white} />
          </TouchableOpacity>

          <View style={s.cardBody}>
            <Image 
              source={{ uri: selectedProp.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} 
              style={s.cardImage} 
              resizeMode="cover"
            />
            
            <View style={s.cardDetails}>
              <View style={s.tagRow}>
                <View style={s.operationTag}>
                  <Text style={s.operationTagText}>
                    {selectedProp.operacion?.toUpperCase() === 'RENTA' ? 'RENTA' : 'VENTA'}
                  </Text>
                </View>
                {selectedProp.tipo_inmueble && (
                  <Text style={s.typeText}>{selectedProp.tipo_inmueble.toUpperCase()}</Text>
                )}
              </View>

              <Text style={s.cardTitle} numberOfLines={1}>
                {selectedProp.titulo}
              </Text>
              
              <Text style={s.cardPrice}>
                ${parseFloat(selectedProp.price || selectedProp.precio || 0).toLocaleString()} MXN
              </Text>
              
              <Text style={s.cardLocation} numberOfLines={1}>
                📍 {user ? selectedProp.ubicacion : `${selectedProp.ubicacion.split(',').pop()?.trim() || 'México'} (Ubicación Protegida)`}
              </Text>

              {user ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity 
                    style={s.ctaBtn} 
                    onPress={() => onSelectProperty(selectedProp.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={s.ctaBtnText}>VER DETALLES</Text>
                    <Feather name="arrow-right" size={12} color={T.black} style={{ marginLeft: 6 }} />
                  </TouchableOpacity>
                  
                  {isModOrAdmin && (
                    <TouchableOpacity 
                      style={[s.ctaBtn, { backgroundColor: '#c93b3b' }]} 
                      onPress={handleDeleteClick}
                      activeOpacity={0.8}
                    >
                      <Feather name="trash-2" size={12} color={T.white} />
                      <Text style={[s.ctaBtnText, { color: T.white, marginLeft: 6 }]}>ELIMINAR</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity 
                  style={[s.ctaBtn, { backgroundColor: '#c93b3b' }]} 
                  onPress={onRequireLogin}
                  activeOpacity={0.8}
                >
                  <Feather name="lock" size={11} color={T.white} style={{ marginRight: 6 }} />
                  <Text style={[s.ctaBtnText, { color: T.white }]}>INICIAR SESIÓN PARA DETALLES</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Modal de Contraseña de Administrador */}
      {showPasswordModal && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>CONTRASEÑA REQUERIDA</Text>
            <Text style={s.modalText}>
              Ingresa la contraseña de administrador para confirmar la eliminación permanente de "{selectedProp?.titulo}":
            </Text>
            <TextInput
              secureTextEntry
              placeholder="Contraseña"
              placeholderTextColor="rgba(255,255,255,0.3)"
              style={s.modalInput}
              value={adminPasswordInput}
              onChangeText={setAdminPasswordInput}
            />
            <View style={s.modalBtnRow}>
              <TouchableOpacity 
                style={[s.modalBtn, s.modalBtnCancel]} 
                onPress={() => {
                  setShowPasswordModal(false);
                  setAdminPasswordInput('');
                }}
              >
                <Text style={s.modalBtnCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[s.modalBtn, s.modalBtnConfirm]} 
                onPress={confirmDeletion}
              >
                <Text style={s.modalBtnConfirmText}>ELIMINAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      {approvalModalVisible && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>SOLICITUD DE MODERACIÓN</Text>
            <Text style={s.modalText}>
              Como moderador, necesitas aprobación del administrador para eliminar esta propiedad del mapa. Ingresa el motivo:
            </Text>
            <TextInput
              style={s.modalInput}
              value={reqReason}
              onChangeText={setReqReason}
              placeholder="Motivo de la solicitud"
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={3}
            />
            <View style={s.modalBtnRow}>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnCancel]} onPress={() => setApprovalModalVisible(false)}>
                <Text style={s.modalBtnCancelText}>CANCELAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.modalBtnConfirm]} onPress={handleSendApprovalRequest}>
                <Text style={s.modalBtnConfirmText}>ENVIAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// Estilo de mapa oscuro premium para combinar con Inmoviral
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#181818" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#8a8a8a" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#373737" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{ "color": "#4e4e4e" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3d3d3d" }]
  }
];

const s = StyleSheet.create({
  container: {
    width: '100%',
    height: 480,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.25)',
    position: 'relative',
    backgroundColor: '#060606',
  },
  lockedMapContainer: {
    backgroundColor: '#0C0C0C',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.15)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 480,
  },
  lockedMapTitle: {
    fontFamily: T.serif,
    fontSize: 18,
    color: T.gold,
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  lockedMapText: {
    fontFamily: T.sans,
    fontSize: 13,
    color: T.muted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 360,
  },
  lockedMapBtn: {
    backgroundColor: T.gold,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 2,
  },
  lockedMapBtnText: {
    fontFamily: T.sans,
    fontSize: 12,
    color: T.black,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 6, 6, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1010,
    padding: 20,
  },
  mapOverlayText: {
    color: T.gold,
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: T.sans,
    letterSpacing: 2,
    textAlign: 'center',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  markerBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#A07840',
    borderWidth: 2,
    borderColor: '#060606',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  markerEmoji: {
    fontSize: 14,
  },
  previewCard: {
    position: 'absolute',
    bottom: 20,
    backgroundColor: '#0C0C0C',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.4)',
    borderRadius: 12,
    padding: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
  },
  previewCardWide: {
    left: '50%',
    width: 480,
    marginLeft: -240,
  },
  previewCardMobile: {
    left: 15,
    right: 15,
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1002,
  },
  cardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.15)',
  },
  cardDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  operationTag: {
    backgroundColor: 'rgba(160, 120, 64, 0.15)',
    borderWidth: 0.5,
    borderColor: T.gold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
  },
  operationTagText: {
    color: T.gold,
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: T.sans,
    letterSpacing: 0.5,
  },
  typeText: {
    color: T.muted,
    fontSize: 9,
    fontFamily: T.sans,
    letterSpacing: 0.5,
  },
  cardTitle: {
    color: T.white,
    fontFamily: T.serif,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  cardPrice: {
    color: T.gold,
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: T.sans,
    marginBottom: 4,
  },
  cardLocation: {
    color: T.muted,
    fontSize: 11,
    fontFamily: T.sans,
    marginBottom: 8,
  },
  ctaBtn: {
    backgroundColor: T.gold,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: {
    color: T.black,
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: T.sans,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6,6,6,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0C0C0C',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.3)',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontFamily: T.serif,
    fontSize: 14,
    color: T.gold,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontFamily: T.sans,
    fontSize: 12,
    color: '#7A6E62',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalInput: {
    width: '100%',
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.25)',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#FFF',
    fontFamily: T.sans,
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    height: 38,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalBtnCancelText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalBtnConfirm: {
    backgroundColor: '#c93b3b',
  },
  modalBtnConfirmText: {
    fontFamily: T.sans,
    fontSize: 11,
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
