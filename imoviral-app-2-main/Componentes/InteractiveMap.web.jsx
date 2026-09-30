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
import { FontAwesome, Feather } from '@expo/vector-icons';
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
  const containerId = useRef(`map-home-${Math.random().toString(36).slice(2)}`);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [selectedProp, setSelectedProp] = useState(null);
  const [isInteractive, setIsInteractive] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const { width } = useWindowDimensions();

  const isAdmin = user?.isAdmin || user?.email === 'ventas@inmoviral.com.mx' || user?.id === 'admin-id-0000';
  const isModerator = user?.isModerator || false;
  const isModOrAdmin = isAdmin || isModerator;

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

  // Filtrar propiedades con coordenadas válidas (de todo el mundo, para permitir ubicar propiedades en China o India)
  const activeProperties = propiedades.filter(p => p.lat && p.lng);

  useEffect(() => {
    if (Platform.OS !== 'web' || !user) return;

    const loadLeaflet = async () => {
      // 1. Cargar CSS si no está cargado
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // 2. Cargar JS si no está cargado
      if (!window.L) {
        await new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }

      const L = window.L;

      // 3. Limpiar mapa anterior si existe
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // 4. Centrar en todo el mundo (centrado en América)
      let centerLat = 23.6345;
      let centerLng = -102.5528;
      let zoomLevel = 3;

      // 5. Inicializar mapa con interacciones desactivadas por defecto
      const mapContainer = document.getElementById(containerId.current);
      if (!mapContainer) return;

      const map = L.map(containerId.current, {
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
      }).setView([centerLat, centerLng], zoomLevel);
      mapInstanceRef.current = map;

      // Usar mapa elegante en tono claro (CartoDB Positron)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(map);

      // Corregir bug de centrado de Leaflet en contenedores con tamaño dinámico
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setView([centerLat, centerLng], zoomLevel, { animate: false });
        }
      }, 150);

      // 6. Icono dorado premium personalizado para el marcador con contraste mejorado (fondo oro sólido y borde negro)
      const customIcon = L.divIcon({
        className: 'inmoviral-gold-marker',
        html: `
          <div style="
            width: 38px;
            height: 38px;
            background-color: #A07840;
            border: 2px solid #060606;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
            transform: scale(1);
          " onmouseover="this.style.transform='scale(1.25)'; this.style.backgroundColor='#C39B5F';" onmouseout="this.style.transform='scale(1)'; this.style.backgroundColor='#A07840';">
            <span style="font-size: 16px; display: block;">🏠</span>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
      });

      // 7. Renderizar marcadores
      markersRef.current = activeProperties.map(prop => {
        const marker = L.marker([parseFloat(prop.lat), parseFloat(prop.lng)], { icon: customIcon }).addTo(map);
        
        marker.on('click', () => {
          setSelectedProp(prop);
          map.setView([parseFloat(prop.lat), parseFloat(prop.lng)], Math.max(map.getZoom(), 14), { animate: true });
        });

        return marker;
      });

      // 8. Deseleccionar propiedad al hacer clic en el fondo del mapa
      map.on('click', (e) => {
        if (e.originalEvent.target.id === containerId.current || e.originalEvent.target.classList.contains('leaflet-container')) {
          setSelectedProp(null);
        }
      });
    };

    // Timeout corto para asegurar que el contenedor se monte antes de cargar Leaflet
    const t = setTimeout(loadLeaflet, 100);
    return () => {
      clearTimeout(t);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [propiedades]);

  const activateMap = () => {
    setIsInteractive(true);
    const map = mapInstanceRef.current;
    if (map) {
      map.dragging.enable();
      map.scrollWheelZoom.enable();
      map.doubleClickZoom.enable();
      map.touchZoom.enable();
    }
  };

  // Si no estamos en web o no hay propiedades para mostrar, no renderizamos nada roto
  if (Platform.OS !== 'web') return null;

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
      <View nativeID={containerId.current} style={s.webMapFrame} />
      
      {/* Overlay de Interacción para evitar Scroll Hijacking */}
      {!isInteractive && (
        <TouchableOpacity style={s.mapOverlay} onPress={activateMap} activeOpacity={0.9}>
          <Feather name="map" size={28} color={T.gold} style={{ marginBottom: 12 }} />
          <Text style={s.mapOverlayText}>
            HAZ CLIC PARA NAVEGAR EN EL MAPA
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
                  <Text style={[s.ctaBtnText, { color: T.white }]}>INICIAR SESIÓN PARA VER DETALLES</Text>
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

const s = StyleSheet.create({
  container: {
    width: '100%',
    height: 480,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.25)',
    position: 'relative',
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
  webMapFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#060606',
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
    marginLeft: -240, // Centrar horizontalmente
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
