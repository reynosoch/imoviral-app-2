import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
  Modal,
  Animated,
  Easing
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext.js';
import PropertyMap from './PropertyMap';
import Footer from './Footer';
import { Feather } from '@expo/vector-icons';
import Chat from './Chat.jsx';

// ─── DESIGN TOKENS (INMOVIRAL MATCHED LUXURY DARK) ───
const T = {
  bgPage: '#0F0D0A',
  bgCard: '#141210',
  textMain: '#F2EDE5',
  textSub: '#7A6E62',
  border: 'rgba(160,120,64,0.15)',
  gold: '#A07840',
  goldLight: '#C49A58',
  white: '#FDFBF8',
  serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Cormorant Garamond, Georgia, serif' }),
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Jost, Montserrat, sans-serif' }),
};

const formatPrecio = (num) => {
  if (num === null || num === undefined) return '0';
  const val = Number(num);
  if (isNaN(val)) return '0';
  if (val >= 1e12) return val.toExponential(2);
  return val.toLocaleString('es-MX', { maximumFractionDigits: 0 });
};

const formatTelefonoRender = (tel) => {
  if (!tel) return '';
  return tel.trim().replace(/\+52\s*\+52/g, '+52');
};

const getIconForAmenity = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes('estacionamiento') || n.includes('garage') || n.includes('cochera')) return 'layout';
  if (n.includes('piscina') || n.includes('alberca') || n.includes('pool') || n.includes('agua')) return 'droplet';
  if (n.includes('wifi') || n.includes('internet')) return 'wifi';
  if (n.includes('aire') || n.includes('clima') || n.includes('ac') || n.includes('calefaccion')) return 'wind';
  if (n.includes('jardin') || n.includes('patio') || n.includes('terraza') || n.includes('balcon') || n.includes('sol')) return 'sun';
  if (n.includes('seguridad') || n.includes('vigilancia') || n.includes('alarma') || n.includes('privado')) return 'shield';
  if (n.includes('amueblado') || n.includes('mueble') || n.includes('cocina')) return 'coffee';
  if (n.includes('gimnasio') || n.includes('gym')) return 'activity';
  if (n.includes('tv') || n.includes('cable') || n.includes('television')) return 'tv';
  if (n.includes('mascota') || n.includes('pet')) return 'smile';
  if (n.includes('cuarto') || n.includes('recamara') || n.includes('habitacion')) return 'grid';
  if (n.includes('baño') || n.includes('bath')) return 'droplet';
  return 'check-circle';
};

export default function VerPropiedad({ propiedadId, onVolver, onStartChat, onNavigate }) {
  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const scrollViewRef = useRef(null);

  const [propiedad, setPropiedad] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [imagenActiva, setImagenActiva] = useState(0);
  const [estatus, setEstatus] = useState('Disponible');
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [notificacion, setNotificacion] = useState(null);
  const [hoveredAmenity, setHoveredAmenity] = useState(null);

  const [hoveredVolver, setHoveredVolver] = useState(false);
  const [hoveredEnviar, setHoveredEnviar] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const galleryFadeAnim = useRef(new Animated.Value(1)).current;

  // Solo visible para admin y moderadores (NO para usuarios regulares ni propietarios)
  const esAdminOMod = !!(user?.isAdmin || user?.isModerator || user?.user_metadata?.role === 'admin' || user?.user_metadata?.role === 'moderator' || user?.email === 'ventas@inmoviral.com.mx');
  const esPropietario = user && propiedad && (user.id === propiedad.user_id || user.id === propiedad.propietario_id || user.id === propiedad.usuario_id);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(translateYAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true })
    ]).start();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [propiedadId]);

  useEffect(() => {
    const cargarData = async () => {
      setCargando(true);
      const { data, error } = await supabase.from('propiedades').select('*').eq('id', propiedadId).single();
      if (!error && data) {
        setPropiedad(data);
        setImagenActiva(0);
        setMensaje(`Hola, me interesa obtener información sobre la propiedad: ${data.titulo}`);
        setEstatus(data.estatus || 'Disponible');
      } else {
        setPropiedad(null);
      }
      setCargando(false);
    };
    if (propiedadId) cargarData();
    else setCargando(false);
  }, [propiedadId]);

  // Escuchar notificaciones de mensajes
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel('mensajes_propiedad')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        if (payload.new && payload.new.sender_id !== user.id) {
          setNotificacion(`Nuevo mensaje de ${payload.new.sender_name || 'Agente'}`);
          setTimeout(() => setNotificacion(null), 5000);
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleEnviarMensaje = async () => {
    if (!user) {
      alert(t('props_fav_login_alert', { defaultValue: 'Debes iniciar sesión para contactar al vendedor.' }));
      return;
    }
    try {
      const roomId = await Chat.crearSala(propiedad, user);
      if (onStartChat) onStartChat(roomId);
    } catch (e) {
      console.error("Error starting chat:", e);
    }
  };

  const handleCambiarEstatus = async (nuevoEstatus) => {
    setEstatus(nuevoEstatus);
    try {
      await supabase.from('propiedades').update({ estatus: nuevoEstatus }).eq('id', propiedad.id);
    } catch (e) { console.error(e); }
  };

  const handleRechazarPropiedad = async () => {
    const msgPrompt = esES ? 'Ingresa el motivo del rechazo:' : 'Enter the reason for rejection:';
    let motivo = '';
    if (Platform.OS === 'web') {
      motivo = window.prompt(msgPrompt);
    } else {
      motivo = esES ? 'No cumple con las políticas de la plataforma' : 'Does not meet platform guidelines';
    }
    
    if (motivo === null) return; // Cancelled
    if (motivo.trim() === '') {
      motivo = esES ? 'No especificado' : 'Not specified';
    }
    
    await handleCambiarEstatus(`rechazada|${motivo.trim()}`);
  };

  const cambiarImagenActiva = (nuevoIdx) => {
    if (nuevoIdx === imagenActiva) return;
    Animated.timing(galleryFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setImagenActiva(nuevoIdx);
      Animated.timing(galleryFadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  if (cargando) return <View style={s.loadingContainer}><ActivityIndicator size="large" color={T.gold} /></View>;
  if (!propiedad) return (
    <View style={s.notFoundContainer}>
      <Text style={s.notFoundTitle}>{t('vp_not_found_title', { defaultValue: 'No Encontrada' })}</Text>
      <TouchableOpacity style={s.backBtn} onPress={() => onVolver && onVolver('home')}><Text style={s.backBtnText}>VOLVER</Text></TouchableOpacity>
    </View>
  );

  const imagenes = propiedad.imagenes?.length ? propiedad.imagenes : ['https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1200&q=80'];
  const esRenta = propiedad.tipo_transaccion === 'Renta';
  const amenidades = propiedad.amenidades || [];
  const esPantallaGrande = width > 1024;
  const esPantallaMediana = width > 768;
  const padHoriz = esPantallaGrande ? 60 : esPantallaMediana ? 40 : 16;
  const esES = (i18n.language || 'es').startsWith('es');
  const hoverProps = (setHover) => Platform.OS === 'web' ? { onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false) } : {};

  return (
    <View style={{ flex: 1 }}>
      {notificacion && (
        <View style={s.toast}>
          <Feather name="bell" size={16} color={T.white} style={{ marginRight: 10 }} />
          <Text style={s.toastText}>{notificacion}</Text>
        </View>
      )}

      <Modal visible={lightboxVisible} transparent={true} animationType="fade" onRequestClose={() => setLightboxVisible(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalHeader}>
            <Text style={s.modalIndex}>{lightboxIndex + 1} / {imagenes.length}</Text>
            <TouchableOpacity onPress={() => setLightboxVisible(false)} style={s.modalCloseBtn}><Text style={s.modalCloseText}>✕</Text></TouchableOpacity>
          </View>
          <View style={s.modalWorkspace}>
            {imagenes.length > 1 && (
              <TouchableOpacity 
                style={s.modalArrowBtn} 
                onPress={() => setLightboxIndex(prev => prev > 0 ? prev - 1 : imagenes.length - 1)}
              >
                <Feather name="chevron-left" size={28} color={T.gold} />
              </TouchableOpacity>
            )}
            
            <View style={s.modalMainImageWrap}>
              <Image source={{ uri: imagenes[lightboxIndex] }} style={s.modalMainImage} resizeMode="contain" />
            </View>
            
            {imagenes.length > 1 && (
              <TouchableOpacity 
                style={s.modalArrowBtn} 
                onPress={() => setLightboxIndex(prev => prev < imagenes.length - 1 ? prev + 1 : 0)}
              >
                <Feather name="chevron-right" size={28} color={T.gold} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <ScrollView ref={scrollViewRef} style={s.page} contentContainerStyle={s.pageScrollContent}>
        {/* HERO HEADER */}
        <View style={[s.propHeader, { minHeight: esPantallaGrande ? 500 : 400 }]}>
          <Image source={{ uri: imagenes[0] }} style={s.propBgImage} resizeMode="cover" />
          <View style={s.propOverlay} />
          <View style={[s.propHeaderBody, { paddingHorizontal: padHoriz }]}>
            <View style={s.breadcrumb}>
              <TouchableOpacity onPress={() => onVolver && onVolver(esRenta ? 'renta' : 'venta')} {...hoverProps(setHoveredVolver)} style={[s.backArrowBtn, hoveredVolver && s.backArrowBtnHover]}>
                <Text style={s.backArrowText}>← {t('vd_back', { defaultValue: 'VOLVER AL INICIO' })}</Text>
              </TouchableOpacity>
              <View style={s.breadcrumbLinks}>
                <Text style={s.breadcrumbText}>{t('vp_breadcrumb_inicio', { defaultValue: 'INICIO' })}</Text>
                <Text style={s.breadcrumbSep}>/</Text>
                <Text style={s.breadcrumbText}>{esRenta ? 'RENTA' : 'VENTA'}</Text>
                <Text style={s.breadcrumbSep}>/</Text>
                <Text style={s.breadcrumbCurrent} numberOfLines={1}>{propiedad.titulo}</Text>
              </View>
            </View>
            <Text style={s.propTitle} numberOfLines={2}>{propiedad.titulo}</Text>
            <View style={s.priceStatsRow}>
              <View>
                <Text style={s.priceLabel}>{t('vp_listing_price', { defaultValue: 'PRECIO' })}</Text>
                <Text style={s.priceAmount}>${formatPrecio(propiedad.precio)} <Text style={s.priceCurrency}>MXN</Text></Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[s.galleryGridSection, { paddingHorizontal: padHoriz }]}>
          <View style={s.galleryContainer}>
            <View style={[s.mainImageContainer, { height: esPantallaGrande ? 480 : 300 }]}>
              
              {imagenes.length > 1 && (
                <TouchableOpacity 
                  style={[s.inlineGalleryArrow, s.inlineGalleryArrowLeft]}
                  onPress={() => cambiarImagenActiva(imagenActiva > 0 ? imagenActiva - 1 : imagenes.length - 1)}
                >
                  <Feather name="chevron-left" size={28} color={T.gold} />
                </TouchableOpacity>
              )}

              <TouchableOpacity activeOpacity={0.9} onPress={() => { setLightboxIndex(imagenActiva); setLightboxVisible(true); }} style={s.mainImageWrapTouchable}>
                <Animated.Image source={{ uri: imagenes[imagenActiva] }} style={[s.mainImage, { opacity: galleryFadeAnim }]} resizeMode="contain" />
                <View style={s.zoomIconOverlay}>
                  <Feather name="maximize-2" size={20} color={T.gold} />
                </View>
              </TouchableOpacity>

              {imagenes.length > 1 && (
                <TouchableOpacity 
                  style={[s.inlineGalleryArrow, s.inlineGalleryArrowRight]}
                  onPress={() => cambiarImagenActiva(imagenActiva < imagenes.length - 1 ? imagenActiva + 1 : 0)}
                >
                  <Feather name="chevron-right" size={28} color={T.gold} />
                </TouchableOpacity>
              )}

            </View>
            {imagenes.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.thumbsHorizontal} contentContainerStyle={s.thumbsHorizontalContent}>
                {imagenes.map((img, idx) => (
                  <TouchableOpacity key={idx} onPress={() => cambiarImagenActiva(idx)} style={[s.thumbItemHoriz, imagenActiva === idx && s.thumbItemHorizActive]}>
                    <Image source={{ uri: img }} style={s.thumbImg} resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View style={[s.propertyContent, { paddingHorizontal: padHoriz }]}>
          <View style={[s.layoutColumns, esPantallaGrande ? s.layoutColumnsWeb : s.layoutColumnsMobile]}>
            
            <View style={s.mainColumn}>
              <View style={s.contentBlock}>
                <Text style={s.contentBlockTitle}>{t('vp_architecture_title', { defaultValue: 'DETALLES DE LA PROPIEDAD' })}</Text>
                <Text style={s.blockParagraph}>{propiedad.descripcion || 'Descripción no disponible.'}</Text>
              </View>

              {amenidades.length > 0 && (
                <View style={s.contentBlock}>
                  <Text style={s.contentBlockTitle}>{t('vp_amenidades_title', { defaultValue: 'AMENIDADES' })}</Text>
                  <View style={s.amenitiesList}>
                    {amenidades.map((am, idx) => {
                      const isHovered = hoveredAmenity === idx;
                      return (
                        <View 
                          key={idx} 
                          style={[s.amenityListItem, { width: esPantallaMediana ? '47%' : '100%' }, isHovered && s.amenityListItemHover]}
                          {...(Platform.OS === 'web' ? { onMouseEnter: () => setHoveredAmenity(idx), onMouseLeave: () => setHoveredAmenity(null) } : {})}
                        >
                          <Feather name={getIconForAmenity(t(am, { defaultValue: am }))} size={22} color={isHovered ? T.goldLight : T.gold} />
                          <Text style={[s.amenityListText, isHovered && s.amenityListTextHover]}>
                            {t(am, { defaultValue: am.replace(/_/g, ' ') })}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={s.contentBlock}>
                <Text style={s.contentBlockTitle}>{t('vp_ubicacion_title', { defaultValue: 'UBICACIÓN EXCLUSIVA' })}</Text>
                <View style={s.mapFrame}>
                  <PropertyMap lat={propiedad.lat} lng={propiedad.lng} />
                  {!user && (
                    <View style={s.mapBlurOverlay}>
                      <Text style={s.lockedMapTitle}>{t('vp_location_locked_title', { defaultValue: 'MAPA RESTRINGIDO' })}</Text>
                      <Text style={s.lockedMapText}>Inicia sesión para ver la ubicación exacta.</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* SIDEBAR CON TARJETA DE CONTACTO PREMIUM */}
            <View style={s.sidebarColumn}>
              <View style={s.sidebarCard}>
                
                {(esPropietario || esAdminOMod) && (() => {
                  const isRechazada = estatus && estatus.startsWith('rechazada');
                  const rejectReason = isRechazada ? estatus.split('|')[1] || '' : '';
                  return (
                    <View style={s.ownerStatusContainer}>
                      {estatus === 'pendiente' && (
                        <View style={{ backgroundColor: 'rgba(160,120,64,0.1)', padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)', alignItems: 'center' }}>
                          <Text style={{ color: T.gold, fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontFamily: T.sans }}>
                            {esES ? 'Pendiente de Autorización' : 'Pending Authorization'}
                          </Text>
                        </View>
                      )}

                      {isRechazada && (
                        <View style={{ backgroundColor: 'rgba(239,68,68,0.1)', padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', alignItems: 'center' }}>
                          <Text style={{ color: '#EF4444', fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', fontFamily: T.sans, marginBottom: 4 }}>
                            {esES ? 'Publicación Rechazada' : 'Listing Rejected'}
                          </Text>
                          {rejectReason ? (
                            <Text style={{ color: '#aaa', fontSize: 10, fontFamily: T.sans, textAlign: 'center' }}>
                              {esES ? `Motivo: ${rejectReason}` : `Reason: ${rejectReason}`}
                            </Text>
                          ) : null}
                        </View>
                      )}

                      {esAdminOMod && (estatus === 'pendiente' || isRechazada) && (
                        <View style={{ gap: 8, marginBottom: 12 }}>
                          <TouchableOpacity 
                            activeOpacity={0.8}
                            onPress={() => handleCambiarEstatus('Disponible')} 
                            style={{ backgroundColor: '#A07840', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderRadius: 2 }}
                          >
                            <Text style={{ color: '#000', fontSize: 11, fontWeight: '700', fontFamily: T.sans, letterSpacing: 1 }}>
                              {esES ? 'APROBAR / AUTORIZAR PUBLICACIÓN' : 'APPROVE / AUTHORIZE LISTING'}
                            </Text>
                          </TouchableOpacity>

                          {estatus === 'pendiente' && (
                            <TouchableOpacity 
                              activeOpacity={0.8}
                              onPress={handleRechazarPropiedad} 
                              style={{ backgroundColor: '#EF4444', paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', borderRadius: 2 }}
                            >
                              <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: T.sans, letterSpacing: 1 }}>
                                {esES ? 'RECHAZAR PUBLICACIÓN' : 'REJECT LISTING'}
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      <Text style={s.ownerStatusTitle}>{esES ? 'ESTATUS DE LA PROPIEDAD' : 'PROPERTY STATUS'}</Text>
                      <View style={s.ownerStatusRow}>
                        {['Disponible', 'En trato', 'Vendida'].map(st => (
                          <TouchableOpacity key={st} onPress={() => handleCambiarEstatus(st)} style={[s.statusBtn, estatus === st && s.statusBtnActive]}>
                            <Text style={[s.statusBtnText, estatus === st && s.statusBtnTextActive]}>{st}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={s.sidebarDivider} />
                    </View>
                  );
                })()}

                {/* HEADER PREMIUM DEL AGENTE */}
                <View style={s.agentPremiumHeader}>
                  <Image source={{ uri: propiedad.foto_contacto || `https://ui-avatars.com/api/?name=${encodeURIComponent(propiedad.nombre_contacto || 'Agente')}&background=A07840&color=fff&size=150` }} style={s.agentAvatar} />
                  <View style={s.agentPremiumInfo}>
                    <Text style={s.agentName}>{propiedad.nombre_contacto || 'Agente Inmoviral'}</Text>
                    <Text style={s.agentRole}>EXECUTIVE BROKER</Text>
                  </View>
                </View>

                {esAdminOMod && (
                  <View style={s.agentContacts}>
                    {propiedad.telefono_contacto && <Text style={s.agentContactText}>Tel: {formatTelefonoRender(propiedad.telefono_contacto)}</Text>}
                    <Text style={s.agentContactText}>Email: {propiedad.email_contacto || 'No disponible'}</Text>
                    <View style={s.actionRow}>
                      <TouchableOpacity onPress={() => Linking.openURL(`tel:${propiedad.telefono_contacto}`)} style={s.altActionBtn}>
                        <Text style={s.altActionBtnText}>{t('vp_llamar', { defaultValue: 'Llamar' })}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Linking.openURL(`https://wa.me/${propiedad.telefono_contacto}`)} style={s.altActionBtn}>
                        <Text style={s.altActionBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                <View style={s.sidebarDivider} />

                {esPropietario ? (
                  <View style={[s.quickForm, { backgroundColor: 'rgba(160,120,64,0.05)', borderWidth: 1, borderColor: 'rgba(160,120,64,0.2)', padding: 16, alignItems: 'center' }]}>
                    <Feather name="home" size={24} color="#A07840" style={{ marginBottom: 8 }} />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: T.sans, textAlign: 'center', marginBottom: 4 }}>
                      {i18n.language?.startsWith('es') ? 'TU PUBLICACIÓN' : 'YOUR LISTING'}
                    </Text>
                    <Text style={{ color: '#aaa', fontSize: 10, textAlign: 'center', lineHeight: 14, fontFamily: T.sans }}>
                      {i18n.language?.startsWith('es') ? 'Esta propiedad fue publicada por ti. No puedes enviarte mensajes a ti mismo.' : 'This property was listed by you. You cannot send messages to yourself.'}
                    </Text>
                  </View>
                ) : (
                  <View style={s.quickForm}>
                    <Text style={s.formTitle}>CONSULTA DIRECTA</Text>
                    <TextInput
                      style={[s.formInput, s.formTextArea]}
                      multiline
                      value={mensaje}
                      onChangeText={setMensaje}
                    />
                    <TouchableOpacity activeOpacity={0.8} onPress={handleEnviarMensaje} {...hoverProps(setHoveredEnviar)} style={[s.submitBtn, hoveredEnviar && s.submitBtnHover]}>
                      <Text style={s.submitBtnText}>{t('vp_form_enviar', { defaultValue: 'ENVIAR MENSAJE' })}</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ID de propiedad — SOLO visible para Admin y Moderadores */}
                {esAdminOMod && (
                  <View style={s.quickFacts}>
                    <View style={s.sidebarDivider} />
                    <View style={s.factRow}>
                      <Text style={s.factKey}>ID de propiedad</Text>
                      <Text style={s.factVal}>INV-{String(propiedad.id).padStart(4, '0')}</Text>
                    </View>
                  </View>
                )}

              </View>
            </View>

          </View>
        </View>

        <Footer onNavigate={onNavigate} />

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: T.bgPage },
  pageScrollContent: { paddingBottom: 0 },
  loadingContainer: { flex: 1, backgroundColor: T.bgPage, justifyContent: 'center', alignItems: 'center', minHeight: 450 },
  notFoundContainer: { flex: 1, backgroundColor: T.bgPage, justifyContent: 'center', alignItems: 'center', minHeight: 450 },
  notFoundTitle: { fontFamily: T.serif, fontSize: 28, color: T.textMain, marginBottom: 12 },
  backBtn: { borderWidth: 1, borderColor: T.gold, paddingVertical: 12, paddingHorizontal: 24 },
  backBtnText: { fontFamily: T.sans, fontSize: 11, color: T.gold, fontWeight: '600', letterSpacing: 2 },
  
  toast: { position: 'absolute', top: 90, alignSelf: 'center', backgroundColor: T.gold, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 30, zIndex: 9999, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10, elevation: 5 },
  toastText: { color: T.white, fontFamily: T.sans, fontSize: 13, fontWeight: '600' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8,7,5,0.98)', justifyContent: 'space-between', paddingVertical: 20, ...Platform.select({ web: { backdropFilter: 'blur(12px)' } }) },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, height: 50 },
  modalIndex: { fontFamily: T.serif, fontSize: 16, color: T.white, letterSpacing: 1.5 },
  modalCloseBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20 },
  modalCloseText: { fontSize: 18, color: T.white, fontWeight: '300' },
  modalWorkspace: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  modalArrowBtn: { width: 50, height: 50, backgroundColor: 'rgba(15,13,10,0.85)', borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)' },
  modalMainImageWrap: { flex: 1, height: '100%', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modalMainImage: { width: '100%', height: '100%', maxWidth: 900 },

  propHeader: { position: 'relative', justifyContent: 'flex-end', backgroundColor: T.bgPage, overflow: 'hidden' },
  propBgImage: { ...StyleSheet.absoluteFillObject, opacity: 0.95 },
  propOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)', ...Platform.select({ web: { backgroundImage: 'linear-gradient(to right, rgba(12,9,5,0.95) 0%, rgba(12,9,5,0.3) 55%, rgba(12,9,5,0) 100%)' } }) },
  propHeaderBody: { position: 'relative', zIndex: 5, paddingBottom: 40, paddingTop: 80, maxWidth: 1400, width: '100%', alignSelf: 'center' },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20, flexWrap: 'wrap', gap: 12 },
  backArrowBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', borderRadius: 1 },
  backArrowBtnHover: { borderColor: T.gold, backgroundColor: 'rgba(160,120,64,0.15)' },
  backArrowText: { fontFamily: T.sans, fontSize: 10, color: T.goldLight, fontWeight: '700', letterSpacing: 1.5 },
  breadcrumbLinks: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  breadcrumbText: { fontFamily: T.sans, fontSize: 10, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' },
  breadcrumbSep: { fontFamily: T.sans, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginHorizontal: 8 },
  breadcrumbCurrent: { fontFamily: T.sans, fontSize: 10, color: T.goldLight, letterSpacing: 1.5, textTransform: 'uppercase', maxWidth: 200 },
  propTitle: { fontFamily: T.serif, fontSize: Platform.OS === 'web' ? 56 : 38, fontWeight: '300', color: T.textMain, lineHeight: Platform.OS === 'web' ? 62 : 44, marginBottom: 12 },
  priceStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.12)', paddingTop: 24, flexWrap: 'wrap', gap: 20 },
  priceLabel: { fontFamily: T.sans, fontSize: 9, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 6 },
  priceAmount: { fontFamily: T.serif, fontSize: 32, color: T.textMain },
  priceCurrency: { fontFamily: T.sans, fontSize: 14, color: T.goldLight, fontWeight: '400', marginLeft: 4 },

  galleryGridSection: { backgroundColor: T.bgPage, paddingTop: 16 },
  galleryContainer: { marginTop: 10, width: '100%', maxWidth: 1400, alignSelf: 'center' },
  mainImageContainer: { width: '100%', backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border, justifyContent: 'center', alignItems: 'center', position: 'relative', borderRadius: 2, overflow: 'hidden' },
  mainImageWrapTouchable: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  mainImage: { width: '100%', height: '100%' },
  inlineGalleryArrow: { position: 'absolute', top: '50%', marginTop: -25, width: 50, height: 50, backgroundColor: 'rgba(15,13,10,0.85)', borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)', zIndex: 10 },
  inlineGalleryArrowLeft: { left: 16 },
  inlineGalleryArrowRight: { right: 16 },
  thumbsHorizontal: { marginTop: 12, flexDirection: 'row' },
  thumbsHorizontalContent: { gap: 10 },
  thumbItemHoriz: { width: 80, height: 60, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  thumbItemHorizActive: { borderColor: T.gold },
  thumbImg: { width: '100%', height: '100%' },
  zoomIconOverlay: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(15,13,10,0.85)', padding: 12, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(160,120,64,0.4)' },

  propertyContent: { backgroundColor: T.bgPage, paddingVertical: 80 },
  layoutColumns: { width: '100%', maxWidth: 1400, alignSelf: 'center' },
  layoutColumnsWeb: Platform.select({ web: { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 80 }, default: {} }),
  layoutColumnsMobile: { flexDirection: 'column', gap: 48 },
  mainColumn: { flex: 1 },
  sidebarColumn: { width: '100%' },

  contentBlock: { marginBottom: 56 },
  contentBlockTitle: { fontFamily: T.serif, fontSize: 26, color: T.textMain, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20, fontWeight: '400' },
  blockParagraph: { fontFamily: T.sans, fontSize: 14, color: 'rgba(242,237,229,0.75)', lineHeight: 26, fontWeight: '300', marginBottom: 16 },

  amenitiesList: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  amenityListItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: 'transparent', backgroundColor: 'rgba(242, 237, 229, 0.02)' },
  amenityListItemHover: { backgroundColor: 'rgba(160,120,64,0.06)', borderColor: 'rgba(160,120,64,0.3)' },
  amenityListText: { fontFamily: T.sans, fontSize: 15, color: 'rgba(242,237,229,0.85)' },
  amenityListTextHover: { color: T.goldLight },

  mapFrame: { height: 320, borderWidth: 1, borderColor: T.border, overflow: 'hidden', backgroundColor: T.bgCard, position: 'relative' },
  mapBlurOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(12,9,5,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10, ...Platform.select({ web: { backdropFilter: 'blur(15px)' } }) },
  lockedMapTitle: { fontFamily: T.serif, fontSize: 16, color: T.goldLight, letterSpacing: 1.5, fontWeight: '500', marginBottom: 6 },
  lockedMapText: { fontFamily: T.sans, fontSize: 12.5, color: T.textMain, textAlign: 'center' },

  sidebarCard: { backgroundColor: T.bgCard, borderWidth: 1, borderColor: T.border, padding: 32, ...Platform.select({ web: { position: 'sticky', top: 120 } }) },
  
  ownerStatusContainer: { marginBottom: 20 },
  ownerStatusTitle: { fontFamily: T.sans, fontSize: 10, color: T.gold, letterSpacing: 1.5, marginBottom: 12, fontWeight: '600' },
  ownerStatusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statusBtn: { paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
  statusBtnActive: { backgroundColor: T.gold, borderColor: T.gold },
  statusBtnText: { fontFamily: T.sans, fontSize: 10, color: T.textSub, fontWeight: '600', letterSpacing: 1 },
  statusBtnTextActive: { color: T.white },

  agentPremiumHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 16 },
  agentAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: T.gold },
  agentPremiumInfo: { flex: 1 },
  agentName: { fontFamily: T.serif, fontSize: 18, color: T.textMain, marginBottom: 4 },
  agentRole: { fontFamily: T.sans, fontSize: 9, color: T.gold, letterSpacing: 1.5, fontWeight: '600' },

  agentContacts: { gap: 8, marginBottom: 16 },
  agentContactText: { fontFamily: T.sans, fontSize: 12.5, color: 'rgba(242,237,229,0.7)' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  altActionBtn: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', paddingVertical: 10 },
  altActionBtnText: { fontFamily: T.sans, fontSize: 11, color: T.textMain, fontWeight: '500' },

  formTitle: { fontFamily: T.sans, fontSize: 11, color: T.textMain, letterSpacing: 2, marginBottom: 12, fontWeight: '600' },
  quickForm: { gap: 10 },
  formInput: { backgroundColor: '#0a0907', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, fontSize: 12.5, color: T.textMain, fontFamily: T.sans, ...Platform.select({ web: { outlineStyle: 'none' } }) },
  formTextArea: { height: 120, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: T.gold, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitBtnHover: { backgroundColor: T.goldLight },
  submitBtnText: { fontFamily: T.sans, fontSize: 10.5, color: T.white, letterSpacing: 1.5, fontWeight: '600' },

  sidebarDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 24 },
  quickFacts: { gap: 12 },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12 },
  factKey: { fontFamily: T.sans, fontSize: 11.5, color: T.textSub },
  factVal: { fontFamily: T.sans, fontSize: 11.5, color: T.textMain, fontWeight: '500' },
});
