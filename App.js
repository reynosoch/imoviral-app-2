import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
  SafeAreaView,
  Animated,
  Easing,
  useWindowDimensions,
  Linking,
  TextInput
} from 'react-native';
import { FontAwesome, Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const logoHorizontal = require('./assets/logo-horizontal.png');

// ══ 💎 CONFIGURACIÓN BILINGÜE NATIVA ══
import './config/i18n';
import { useTranslation } from 'react-i18next';

// Componentes del ecosistema Inmoviral
import LoginPage from './Componentes/LoginPage.jsx';
import PropiedadesVenta from './Componentes/PropiedadesVenta.jsx';
import PropiedadesRenta from './Componentes/PropiedadesRenta.jsx';
import VerPropiedad from './Componentes/VerPropiedad.jsx';
import ServiciosVirales from './Componentes/ServiciosVirales.jsx';
import SobreNosotros from './Componentes/SobreNosotros.jsx';
import SobreNosotrosSection from './Componentes/SobreNosotrosSection.jsx';
import Vendedor from './Componentes/Vendedor.jsx';
import Footer from './Componentes/Footer';
import UserMenu from './Componentes/UserMenu';
import Dashboard from './Componentes/Dashboard.jsx';
import NuestroProceso from './Componentes/NuestroProceso.jsx';
import Testimonios from './Componentes/Testimonios.jsx';
import NuestrasSoluciones from './Componentes/NuestrasSoluciones.jsx';
import Resenas from './Componentes/Resenas.jsx';
import Chat from './Componentes/Chat.jsx';
import Perfil from './Componentes/Perfil.jsx';
import Configuracion from './Componentes/Configuracion.jsx';
import InteractiveMap from './Componentes/InteractiveMap';

import { useAuth, AuthProvider } from './AuthContext.js';
import { supabase } from './supabaseClient';
import { fetchUsers, fetchModerators } from './Componentes/systemSync';

const LUXURY_FONT = 'Cormorant Garamond, Georgia, serif';
const SERIF_FONT = Platform.OS === 'ios' ? 'Georgia' : Platform.OS === 'android' ? 'serif' : 'Georgia, serif';
const SANS_FONT = Platform.OS === 'ios' ? 'System' : 'sans-serif';

const MOCK_PROPERTIES = [];

const TICKER_PHRASES = [
  'LUXURY RESIDENCES',
  'PREMIUM REAL ESTATE INVESTMENTS',
  'EXCLUSIVE LISTINGS',
  'SEAMLESS TRANSACTIONS',
  'EXCLUSIVE MARKET ACCESS',
  'CONFIDENTIAL NEGOTIATIONS',
];

const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24);
const safeTopPadding = Platform.OS === 'web' ? 0 : STATUS_BAR_HEIGHT;

const formatPrecioHome = (num) => {
  if (num === null || num === undefined) return '0';
  const val = Number(num);
  if (isNaN(val)) return '0';
  if (val >= 1e12) {
    return val.toExponential(2);
  }
  return val.toLocaleString('es-MX', { maximumFractionDigits: 0 });
};

const getStoredDeletedNotifs = async (userId) => {
  if (!userId) return [];
  try {
    const key = `inmoviral_deleted_notifs_${userId}`;
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } else {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    }
  } catch (e) {
    return [];
  }
};

const saveStoredDeletedNotif = async (userId, notifId) => {
  if (!userId) return;
  try {
    const key = `inmoviral_deleted_notifs_${userId}`;
    let list = [];
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      list = val ? JSON.parse(val) : [];
      if (!list.includes(notifId)) {
        list.push(notifId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } else {
      const val = await AsyncStorage.getItem(key);
      list = val ? JSON.parse(val) : [];
      if (!list.includes(notifId)) {
        list.push(notifId);
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch (e) {}
};

const saveStoredDeletedNotifsBulk = async (userId, notifIds) => {
  if (!userId) return;
  try {
    const key = `inmoviral_deleted_notifs_${userId}`;
    let list = [];
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      list = val ? JSON.parse(val) : [];
      notifIds.forEach(id => {
        if (!list.includes(id)) list.push(id);
      });
      localStorage.setItem(key, JSON.stringify(list));
    } else {
      const val = await AsyncStorage.getItem(key);
      list = val ? JSON.parse(val) : [];
      notifIds.forEach(id => {
        if (!list.includes(id)) list.push(id);
      });
      await AsyncStorage.setItem(key, JSON.stringify(list));
    }
  } catch (e) {}
};

const getStoredReadNotifs = async (userId) => {
  if (!userId) return [];
  try {
    const key = `inmoviral_read_notifs_${userId}`;
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    } else {
      const val = await AsyncStorage.getItem(key);
      return val ? JSON.parse(val) : [];
    }
  } catch (e) {
    return [];
  }
};

const saveStoredReadNotif = async (userId, notifId) => {
  if (!userId) return;
  try {
    const key = `inmoviral_read_notifs_${userId}`;
    let list = [];
    if (Platform.OS === 'web') {
      const val = localStorage.getItem(key);
      list = val ? JSON.parse(val) : [];
      if (!list.includes(notifId)) {
        list.push(notifId);
        localStorage.setItem(key, JSON.stringify(list));
      }
    } else {
      const val = await AsyncStorage.getItem(key);
      list = val ? JSON.parse(val) : [];
      if (!list.includes(notifId)) {
        list.push(notifId);
        await AsyncStorage.setItem(key, JSON.stringify(list));
      }
    }
  } catch (e) {}
};

/* ─────────────────────────────────────────────
   COMPONENTE DE APLICACIÓN PRINCIPAL
   ───────────────────────────────────────────── */
function MainApp() {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const { width } = useWindowDimensions();

  const esPantallaGrande = width > 768;
  const idiomaActual = i18n.language || 'es';

  const [vista, setVista] = useState('home');
  const [sobreNosotrosSection, setSobreNosotrosSection] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('dashboard');
  const [propiedadParaEditar, setPropiedadParaEditar] = useState(null);
  const [mobileNavAbierto, setMobileNavAbierto] = useState(false);
  const [userMenuAbierto, setUserMenuAbierto] = useState(false);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [propiedades, setPropiedades] = useState([]);
  const [usersRegistry, setUsersRegistry] = useState([]);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [navScrolled, setNavScrolled] = useState(false); // Estado del navbar (transparent vs solid)
  const mainScrollRef = useRef(null);

  useEffect(() => {
    const cargarRegistro = async () => {
      try {
        const users = await fetchUsers();
        setUsersRegistry(users || []);
      } catch (e) {
        console.error("Error cargando usuarios:", e);
      }
    };
    cargarRegistro();
  }, [vista]);

  const navegarA = (targetVista, section = null) => {
    // Resetea el estado de scroll para que el navbar empiece transparente
    scrollY.setValue(0);
    setNavScrolled(false);
    setVista(targetVista);
    setSobreNosotrosSection(section);
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.scrollTo(0, 0);
    }
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ y: 0, animated: false });
    }
    // Resetea el navbar al transparente en cada cambio de página
    setNavScrolled(false);
    scrollY.setValue(0);
  }, [vista, propiedadSeleccionada]);

  const propiedadesPorPagina = 6;

  const propiedadesFiltradasPlus = useMemo(() => {
    if (!propiedades || propiedades.length === 0) return [];
    const plusUserIds = new Set(usersRegistry.filter(u => u.inmoviralPlus).map(u => u.id));
    return propiedades.filter(p => p.user_id && plusUserIds.has(p.user_id));
  }, [propiedades, usersRegistry]);

  const totalPaginas = useMemo(() => {
    return Math.ceil(propiedadesFiltradasPlus.length / propiedadesPorPagina);
  }, [propiedadesFiltradasPlus]);

  const listaPropiedadesPaginada = useMemo(() => {
    if (propiedadesFiltradasPlus.length === 0) return [];
    const pageIndex = paginaActual > totalPaginas ? 1 : paginaActual;
    return propiedadesFiltradasPlus.slice((pageIndex - 1) * propiedadesPorPagina, pageIndex * propiedadesPorPagina);
  }, [propiedadesFiltradasPlus, paginaActual, totalPaginas]);

  const propiedadesMapa = useMemo(() => {
    return propiedadesFiltradasPlus;
  }, [propiedadesFiltradasPlus]);

  // Contadores Animados (Count-Up)
  const [countYears, setCountYears] = useState(0);
  const [countProps, setCountProps] = useState(0);

  // Referencia animada de scroll continuo y sus interpolaciones premium
  const scrollY = useRef(new Animated.Value(0)).current;
  // Fade-in del landing page (solo opacidad, sin slide para evitar gaps)
  const homeFadeAnim = useRef(new Animated.Value(0)).current;
  const [hoveredLogin, setHoveredLogin] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [hoveredHeroBtn, setHoveredHeroBtn] = useState(false);
  const [hoveredFeatureIdx, setHoveredFeatureIdx] = useState(null);
  const [hoveredCtaBtn, setHoveredCtaBtn] = useState(false);
  const [hoveredPublishNav, setHoveredPublishNav] = useState(false);
  const [langDropdownAbierto, setLangDropdownAbierto] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langAnim = useRef(new Animated.Value(0)).current;

  const [notifDropdownAbierto, setNotifDropdownAbierto] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifAnim = useRef(new Animated.Value(0)).current;

  const [showNotifRejectModal, setShowNotifRejectModal] = useState(false);
  const [notifRejectProp, setNotifRejectProp] = useState(null);
  const [notifRejectReason, setNotifRejectReason] = useState('');

  const [notificaciones, setNotificaciones] = useState([
    {
      id: 'welcome',
      titulo: '¡Bienvenido a Inmoviral!',
      tituloEn: 'Welcome to Inmoviral!',
      descripcion: 'Completa tu perfil para aprovechar al máximo las herramientas.',
      descripcionEn: 'Complete your profile to get the most out of our tools.',
      created_at: new Date().toISOString(),
      tipo: 'sistema',
      leido: false,
    },
    {
      id: 'update',
      titulo: 'Nueva actualización',
      tituloEn: 'New Update',
      descripcion: 'Ya puedes publicar propiedades en el mapa interactivo y ganar visibilidad.',
      descripcionEn: 'You can now publish properties on the interactive map for more visibility.',
      created_at: new Date().toISOString(),
      tipo: 'sistema',
      leido: false,
    }
  ]);

  const handleAprobarPropiedadDesdeNotif = async (notif) => {
    try {
      const propId = notif.propiedadId;
      if (!propId) return;
      
      const { error } = await supabase
        .from('propiedades')
        .update({ estatus: 'Disponible' })
        .eq('id', propId);
        
      if (error) throw error;
      
      setNotificaciones(prev => prev.filter(n => n.id !== notif.id));
      if (user) await saveStoredDeletedNotif(user.id, notif.id);
      
      alert(idiomaActual.startsWith('es') ? 'Propiedad aprobada con éxito.' : 'Property approved successfully.');
    } catch (err) {
      console.error(err);
      alert(idiomaActual.startsWith('es') ? 'Error al aprobar la propiedad.' : 'Error approving property.');
    }
  };

  const handleRechazarPropiedadDesdeNotif = (notif) => {
    setNotifRejectProp(notif);
    setNotifRejectReason('');
    setShowNotifRejectModal(true);
    setNotifDropdownAbierto(false);
  };

  const confirmRechazoDesdeNotif = async () => {
    if (!notifRejectReason.trim()) {
      alert(idiomaActual.startsWith('es') ? 'Por favor ingresa un motivo para el rechazo.' : 'Please enter a reason for the rejection.');
      return;
    }
    if (!notifRejectProp) return;
    
    try {
      const propId = notifRejectProp.propiedadId;
      if (!propId) return;
      
      const formattedStatus = `rechazada|${notifRejectReason.trim()}`;
      const { error } = await supabase
        .from('propiedades')
        .update({ estatus: formattedStatus })
        .eq('id', propId);
        
      if (error) throw error;
      
      setNotificaciones(prev => prev.filter(n => n.id !== notifRejectProp.id));
      if (user) await saveStoredDeletedNotif(user.id, notifRejectProp.id);
      
      setShowNotifRejectModal(false);
      setNotifRejectProp(null);
      setNotifRejectReason('');
      
      alert(idiomaActual.startsWith('es') ? 'Propiedad rechazada con éxito.' : 'Property rejected successfully.');
    } catch (err) {
      console.error(err);
      alert(idiomaActual.startsWith('es') ? 'Error al rechazar la propiedad.' : 'Error rejecting property.');
    }
  };

  useEffect(() => {
    if (!user) {
      setNotificaciones(prev => prev.filter(n => n.tipo === 'sistema'));
      return;
    }

    const cargarNotificacionesMsgs = async () => {
      try {
        const isAdmin = user.isAdmin || user.id === 'admin-id-0000';
        const mods = await fetchModerators();
        const isModerator = mods.includes(user.id);

        const deletedIds = await getStoredDeletedNotifs(user.id);
        const readIds = await getStoredReadNotifs(user.id);
        
        // Load pending properties for review if admin or moderator
        if (isAdmin || isModerator) {
          try {
            const { data: pendingProps, error: pendingError } = await supabase
              .from('propiedades')
              .select('id, titulo, created_at, nombre_contacto')
              .eq('estatus', 'pendiente');
              
            if (!pendingError && pendingProps) {
              const propNotifs = pendingProps
                .map(p => ({
                  id: `review-${p.id}`,
                  titulo: 'Propiedad pendiente de revisión',
                  tituloEn: 'Property pending review',
                  descripcion: `Nueva propiedad: "${p.titulo}" para autorizar.`,
                  descripcionEn: `New property: "${p.titulo}" for approval.`,
                  created_at: p.created_at || new Date().toISOString(),
                  tipo: 'revision',
                  propiedadId: p.id,
                  leido: readIds.includes(`review-${p.id}`),
                }))
                .filter(n => !deletedIds.includes(n.id));
              
              setNotificaciones(prev => {
                const merged = [...prev];
                propNotifs.forEach(notif => {
                  if (!merged.some(n => n.id === notif.id)) {
                    merged.push(notif);
                  }
                });
                return merged.filter(n => !deletedIds.includes(n.id));
              });
            }
          } catch (pe) {
            console.error("Error loading pending properties for review:", pe);
          }
        }

        // Load seller status notifications
        try {
          const { data: userProps, error: userPropsError } = await supabase
            .from('propiedades')
            .select('id, titulo, estatus, created_at')
            .eq('user_id', user.id);

          if (!userPropsError && userProps) {
            const sellerNotifs = [];
            userProps.forEach(p => {
              const isPending = p.estatus === 'pendiente';
              const isRejected = p.estatus && p.estatus.startsWith('rechazada');
              const isApproved = p.estatus === 'Disponible';

              if (isPending) {
                const notifId = `pending-${p.id}`;
                if (!deletedIds.includes(notifId)) {
                  sellerNotifs.push({
                    id: notifId,
                    titulo: idiomaActual.startsWith('es') ? 'Propiedad pendiente de aprobación' : 'Listing pending approval',
                    tituloEn: 'Listing pending approval',
                    descripcion: idiomaActual.startsWith('es')
                      ? `Tu propiedad "${p.titulo}" está pendiente de aprobación.`
                      : `Your property "${p.titulo}" is pending approval.`,
                    descripcionEn: `Your property "${p.titulo}" is pending approval.`,
                    created_at: p.created_at || new Date().toISOString(),
                    tipo: 'sistema',
                    leido: readIds.includes(notifId),
                  });
                }
              } else if (isRejected) {
                const notifId = `rejected-${p.id}`;
                if (!deletedIds.includes(notifId)) {
                  const reason = p.estatus.split('|')[1] || (idiomaActual.startsWith('es') ? 'No especificado' : 'Not specified');
                  sellerNotifs.push({
                    id: notifId,
                    titulo: idiomaActual.startsWith('es') ? 'Propiedad rechazada' : 'Listing rejected',
                    tituloEn: 'Listing rejected',
                    descripcion: idiomaActual.startsWith('es')
                      ? `Tu propiedad "${p.titulo}" fue rechazada. Motivo: ${reason}`
                      : `Your property "${p.titulo}" was rejected. Reason: ${reason}`,
                    descripcionEn: `Your property "${p.titulo}" was rejected. Reason: ${reason}`,
                    created_at: p.created_at || new Date().toISOString(),
                    tipo: 'sistema',
                    leido: readIds.includes(notifId),
                  });
                }
              } else if (isApproved) {
                const notifId = `approved-${p.id}`;
                if (!deletedIds.includes(notifId)) {
                  sellerNotifs.push({
                    id: notifId,
                    titulo: idiomaActual.startsWith('es') ? 'Propiedad aprobada' : 'Listing approved',
                    tituloEn: 'Listing approved',
                    descripcion: idiomaActual.startsWith('es')
                      ? `Tu propiedad "${p.titulo}" se aprobó y publicó exitosamente.`
                      : `Your property "${p.titulo}" was approved and published successfully.`,
                    descripcionEn: `Your property "${p.titulo}" was approved and published successfully.`,
                    created_at: p.created_at || new Date().toISOString(),
                    tipo: 'sistema',
                    leido: readIds.includes(notifId),
                  });
                }
              }
            });

            setNotificaciones(prev => {
              const merged = [...prev];
              sellerNotifs.forEach(notif => {
                if (!merged.some(n => n.id === notif.id)) {
                  merged.push(notif);
                }
              });
              return merged.filter(n => !deletedIds.includes(n.id));
            });
          }
        } catch (pe) {
          console.error("Error loading seller notifications:", pe);
        }

        let roomsData = [];
        if (isAdmin || isModerator) {
          const { data, error } = await supabase.from('chat_rooms').select('id, propiedad_titulo');
          if (!error && data) roomsData = data;
        } else {
          const { data, error } = await supabase.from('chat_rooms').select('id, propiedad_titulo')
            .or(`comprador_id.eq.${user.id},vendedor_id.eq.${user.id}`);
          if (!error && data) roomsData = data;
        }

        if (roomsData.length === 0) return;
        const roomIds = roomsData.map(r => r.id);
        
        const { data: msgs, error: msgsError } = await supabase
          .from('chat_messages')
          .select('*')
          .in('room_id', roomIds)
          .neq('sender_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!msgsError && msgs) {
          const msgNotifs = msgs
            .map(m => {
              const room = roomsData.find(r => r.id === m.room_id);
              const isRead = m.leido || readIds.includes(m.id);
              return {
                id: m.id,
                titulo: `Nuevo mensaje de ${m.sender_name}`,
                tituloEn: `New message from ${m.sender_name}`,
                descripcion: `Chat en: ${room?.propiedad_titulo || 'Propiedad'}\n"${m.mensaje}"`,
                descripcionEn: `Chat in: ${room?.propiedad_titulo || 'Property'}\n"${m.mensaje}"`,
                created_at: m.created_at,
                tipo: 'chat',
                roomId: m.room_id,
                leido: isRead,
              };
            })
            .filter(n => !deletedIds.includes(n.id));

          setNotificaciones(prev => {
            const systemNotifs = prev.filter(n => n.tipo === 'sistema' && !deletedIds.includes(n.id));
            const merged = [...systemNotifs];
            msgNotifs.forEach(notif => {
              if (!merged.some(n => n.id === notif.id)) {
                merged.push(notif);
              }
            });
            return merged.map(n => readIds.includes(n.id) ? { ...n, leido: true } : n);
          });
        }
      } catch (err) {
        console.error("Error loading chat notifications:", err);
      }
    };

    cargarNotificacionesMsgs();

    const channel = supabase.channel('notificaciones_globales')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, async (payload) => {
        const newMsg = payload.new;
        if (!newMsg) return;
        if (newMsg.sender_id === user.id) return;

        const deletedIds = await getStoredDeletedNotifs(user.id);
        if (deletedIds.includes(newMsg.id)) return;

        const readIds = await getStoredReadNotifs(user.id);
        const isRead = newMsg.leido || readIds.includes(newMsg.id);

        let roomTitle = 'Propiedad';
        try {
          const { data: room, error: roomError } = await supabase
            .from('chat_rooms')
            .select('propiedad_titulo')
            .eq('id', newMsg.room_id)
            .maybeSingle();
          if (!roomError && room?.propiedad_titulo) {
            roomTitle = room.propiedad_titulo;
          }
        } catch (e) {
          console.warn("Could not fetch room title for notification:", e);
        }

        setNotificaciones(prev => {
          if (prev.some(n => n.id === newMsg.id)) return prev;
          const newNotif = {
            id: newMsg.id,
            titulo: `Nuevo mensaje de ${newMsg.sender_name}`,
            tituloEn: `New message from ${newMsg.sender_name}`,
            descripcion: `Chat en: ${roomTitle}\n"${newMsg.mensaje}"`,
            descripcionEn: `Chat in: ${roomTitle}\n"${newMsg.mensaje}"`,
            created_at: newMsg.created_at,
            tipo: 'chat',
            roomId: newMsg.room_id,
            leido: isRead,
          };
          return [newNotif, ...prev];
        });
      }).subscribe();

    const propChannel = supabase.channel('propiedades_revision')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'propiedades' }, async (payload) => {
        const newProp = payload.new;
        if (!newProp) return;
        
        // 1. If pending, notify Admin/Moderators
        if (newProp.estatus === 'pendiente') {
          const notifId = `review-${newProp.id}`;
          const deletedIds = await getStoredDeletedNotifs(user?.id);
          if (deletedIds.includes(notifId)) return;

          const readIds = await getStoredReadNotifs(user?.id);
          const isRead = readIds.includes(notifId);

          const isAdmin = user?.isAdmin || user?.id === 'admin-id-0000';
          const mods = await fetchModerators();
          const isModerator = mods.includes(user?.id);

          if (isAdmin || isModerator) {
            setNotificaciones(prev => {
              if (prev.some(n => n.id === notifId)) return prev;
              const newNotif = {
                id: notifId,
                titulo: 'Propiedad pendiente de revisión',
                tituloEn: 'Property pending review',
                descripcion: `Nueva propiedad: "${newProp.titulo}" para autorizar.`,
                descripcionEn: `New property: "${newProp.titulo}" for approval.`,
                created_at: newProp.created_at || new Date().toISOString(),
                tipo: 'revision',
                propiedadId: newProp.id,
                leido: isRead,
              };
              return [newNotif, ...prev];
            });
          }
        }
        
        // 2. If inserted property is owned by current user, also show pending notification for user
        if (newProp.user_id === user?.id) {
          const notifId = `pending-${newProp.id}`;
          const deletedIds = await getStoredDeletedNotifs(user?.id);
          if (deletedIds.includes(notifId)) return;
          
          setNotificaciones(prev => {
            if (prev.some(n => n.id === notifId)) return prev;
            return [{
              id: notifId,
              titulo: idiomaActual.startsWith('es') ? 'Propiedad pendiente de aprobación' : 'Listing pending approval',
              tituloEn: 'Listing pending approval',
              descripcion: idiomaActual.startsWith('es')
                ? `Tu propiedad "${newProp.titulo}" está pendiente de aprobación.`
                : `Your property "${newProp.titulo}" is pending approval.`,
              descripcionEn: `Your property "${newProp.titulo}" is pending approval.`,
              created_at: newProp.created_at || new Date().toISOString(),
              tipo: 'sistema',
              leido: false,
            }, ...prev];
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'propiedades' }, async (payload) => {
        const updatedProp = payload.new;
        if (!updatedProp) return;
        
        // A. If status changed to Disponible (approved) and we are admin/moderator, remove the 'review-[id]' notification
        const isAdmin = user?.isAdmin || user?.id === 'admin-id-0000';
        const mods = await fetchModerators();
        const isModerator = mods.includes(user?.id);
        if ((isAdmin || isModerator) && updatedProp.estatus === 'Disponible') {
          setNotificaciones(prev => prev.filter(n => n.id !== `review-${updatedProp.id}`));
        }

        // B. If the logged-in user is the owner of the property
        if (updatedProp.user_id === user?.id) {
          const isPending = updatedProp.estatus === 'pendiente';
          const isRejected = updatedProp.estatus && updatedProp.estatus.startsWith('rechazada');
          const isApproved = updatedProp.estatus === 'Disponible';
          
          const pendingNotifId = `pending-${updatedProp.id}`;
          const rejectedNotifId = `rejected-${updatedProp.id}`;
          const approvedNotifId = `approved-${updatedProp.id}`;
          
          setNotificaciones(prev => {
            let nextNotifs = prev.filter(n => n.id !== pendingNotifId && n.id !== rejectedNotifId && n.id !== approvedNotifId);
            
            if (isPending) {
              nextNotifs.unshift({
                id: pendingNotifId,
                titulo: idiomaActual.startsWith('es') ? 'Propiedad pendiente de aprobación' : 'Listing pending approval',
                tituloEn: 'Listing pending approval',
                descripcion: idiomaActual.startsWith('es')
                  ? `Tu propiedad "${updatedProp.titulo}" está pendiente de aprobación.`
                  : `Your property "${updatedProp.titulo}" is pending approval.`,
                descripcionEn: `Your property "${updatedProp.titulo}" is pending approval.`,
                created_at: new Date().toISOString(),
                tipo: 'sistema',
                leido: false,
              });
            } else if (isRejected) {
              const reason = updatedProp.estatus.split('|')[1] || (idiomaActual.startsWith('es') ? 'No especificado' : 'Not specified');
              nextNotifs.unshift({
                id: rejectedNotifId,
                titulo: idiomaActual.startsWith('es') ? 'Propiedad rechazada' : 'Listing rejected',
                tituloEn: 'Listing rejected',
                descripcion: idiomaActual.startsWith('es')
                  ? `Tu propiedad "${updatedProp.titulo}" fue rechazada. Motivo: ${reason}`
                  : `Your property "${updatedProp.titulo}" was rejected. Reason: ${reason}`,
                descripcionEn: `Your property "${updatedProp.titulo}" was rejected. Reason: ${reason}`,
                created_at: new Date().toISOString(),
                tipo: 'sistema',
                leido: false,
              });
            } else if (isApproved) {
              nextNotifs.unshift({
                id: approvedNotifId,
                titulo: idiomaActual.startsWith('es') ? 'Propiedad aprobada' : 'Listing approved',
                tituloEn: 'Listing approved',
                descripcion: idiomaActual.startsWith('es')
                  ? `Tu propiedad "${updatedProp.titulo}" se aprobó y publicó exitosamente.`
                  : `Your property "${updatedProp.titulo}" was approved and published successfully.`,
                descripcionEn: `Your property "${updatedProp.titulo}" was approved and published successfully.`,
                created_at: new Date().toISOString(),
                tipo: 'sistema',
                leido: false,
              });
            }
            return nextNotifs;
          });
        }
      }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(propChannel);
    };
  }, [user]);

  const handleNotifPress = async (notif) => {
    setNotificaciones(prev => prev.map(n => n.id === notif.id ? { ...n, leido: true } : n));
    if (user) {
      await saveStoredReadNotif(user.id, notif.id);
    }
    if (notif.tipo === 'chat' && notif.roomId) {
      setChatRoomId(notif.roomId);
      setVista('chat');
      setNotifDropdownAbierto(false);
    } else if (notif.tipo === 'revision' && notif.propiedadId) {
      setPropiedadSeleccionada(notif.propiedadId);
      setVista('propiedad');
      setNotifDropdownAbierto(false);
    }
  };

  const borrarNotificacion = async (id) => {
    setNotificaciones(prev => prev.filter(n => n.id !== id));
    if (user) {
      await saveStoredDeletedNotif(user.id, id);
    }
  };

  const borrarTodasLasNotificaciones = async () => {
    const ids = notificaciones.map(n => n.id);
    setNotificaciones([]);
    if (user) {
      await saveStoredDeletedNotifsBulk(user.id, ids);
    }
  };

  useEffect(() => {
    if (notifDropdownAbierto) {
      setShowNotifMenu(true);
      Animated.timing(notifAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    } else {
      Animated.timing(notifAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setShowNotifMenu(false));
    }
  }, [notifDropdownAbierto]);

  useEffect(() => {
    if (langDropdownAbierto) {
      setShowLangMenu(true);
      Animated.timing(langAnim, { toValue: 1, duration: 250, useNativeDriver: false }).start();
    } else {
      Animated.timing(langAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => setShowLangMenu(false));
    }
  }, [langDropdownAbierto]);

  const tickerValue = useRef(new Animated.Value(0)).current;

  const TRANSPARENT_VIEWS = ['home', 'propiedad', 'venta', 'renta', 'remates', 'servicios', 'nosotros'];
  const isTransparentView = TRANSPARENT_VIEWS.includes(vista);

  // ─── HANDLER UNIVERSAL DE SCROLL ────────────────────────────────────────
  // En Expo Web el Animated.ScrollView hace scroll del document/window,
  // no de un div interno, por eso onScroll del componente nunca dispara.
  // Usamos window.addEventListener como fuente principal en web.
  const handleScrollUniversal = (event) => {
    // Para ScrollViews nativos (iOS/Android) y sub-páginas en web
    const y = event?.nativeEvent?.contentOffset?.y
      ?? event?.nativeEvent?.target?.scrollTop
      ?? 0;
    setNavScrolled(y > 80);
  };

  // Handler para el Animated.ScrollView de la home — ya no usa Animated.event
  // porque en web el listener no se dispara; usamos función directa
  const handleScroll = (event) => {
    const y = event?.nativeEvent?.contentOffset?.y
      ?? event?.nativeEvent?.target?.scrollTop
      ?? 0;
    scrollY.setValue(y);
    setNavScrolled(y > 80);
  };

  // Handler para ScrollViews de sub-páginas
  const handleScrollPages = handleScrollUniversal;

  // Colores del navbar según estado
  const _navbarTransparent = isTransparentView && !navScrolled;
  const navbarBg      = _navbarTransparent ? 'rgba(6,6,6,0)'         : '#0C0C0C';
  const navbarBorder  = _navbarTransparent ? 'rgba(160,120,64,0)'    : 'rgba(160,120,64,0.15)';
  const navbarPadTop  = _navbarTransparent ? 20 + safeTopPadding     : 14 + safeTopPadding;
  const navbarPadBot  = _navbarTransparent ? 20                      : 14;

  const animatedNavBarStyle = esPantallaGrande ? {
    backgroundColor: navbarBg,
    borderBottomColor: navbarBorder,
    paddingTop: navbarPadTop,
    paddingBottom: navbarPadBot,
    // Transición suave en web
    ...(Platform.OS === 'web' ? { transition: 'background-color 0.3s ease, border-color 0.3s ease, padding 0.3s ease' } : {}),
  } : {
    position: 'relative',
    top: undefined,
    left: undefined,
    right: undefined,
    width: '100%',
    backgroundColor: '#0C0C0C',
    borderBottomColor: 'rgba(160, 120, 64, 0.15)',
    paddingTop: 8,
    paddingBottom: 8,
  };

  const obtenerIniciales = () => {
    if (!user) return 'GR';
    if (user.user_metadata?.full_name) {
      const partes = user.user_metadata.full_name.split(' ');
      if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
      return partes[0][0].toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };

  const isUserPlus = user ? usersRegistry.some(u => u.id === user.id && u.inmoviralPlus) : false;

  const cambiarIdioma = (idioma) => i18n.changeLanguage(idioma);
  const irAPropiedad = (id) => { setPropiedadSeleccionada(id); setVista('propiedad'); setMobileNavAbierto(false); };
  const navegacionMovil = (destino) => { setVista(destino); setMobileNavAbierto(false); };
  const volverDePropiedad = (destino) => { setPropiedadSeleccionada(null); setVista(destino || 'home'); };

  useEffect(() => {
    if (vista !== 'home') return;
    // Fade-in: reset y re-dispara cada vez que se navega al home
    homeFadeAnim.setValue(0);
    Animated.timing(homeFadeAnim, {
      toValue: 1,
      duration: 600,
      delay: 50,
      useNativeDriver: true,
    }).start();
    // Counter-up animado
    let startYears = 0, startProps = 0;
    const timer = setInterval(() => {
      startYears += 12 / 40; startProps += 150 / 40;
      if (startYears >= 12) { setCountYears(12); setCountProps(150); clearInterval(timer); }
      else { setCountYears(Math.floor(startYears)); setCountProps(Math.floor(startProps)); }
    }, 40);
    return () => clearInterval(timer);
  }, [vista]);

  useEffect(() => {
    const cargarCasas = async () => {
      const { data, error } = await supabase.from('propiedades').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        const isAdmin = user?.isAdmin || user?.email === 'ventas@inmoviral.com.mx' || user?.id === 'admin-id-0000';
        const mods = await fetchModerators();
        const isModerator = mods.includes(user?.id);

        const filtered = data.filter(p => {
          const isAvailable = !p.estatus || p.estatus === 'Disponible';
          if (isAvailable) return true;
          if (isAdmin || isModerator) return true;
          if (user && p.user_id === user.id) return true;
          return false;
        });
        setPropiedades(filtered);
      }
    };
    cargarCasas();
  }, [vista, user]);

  useEffect(() => {
    if (user && vista === 'login') {
      setVista('home');
    }
  }, [user, vista]);

  useEffect(() => {
    const loopAnimation = () => {
      tickerValue.setValue(0);
      Animated.timing(tickerValue, { toValue: -1200, duration: 32000, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }).start(() => loopAnimation());
    };
    loopAnimation();
  }, [tickerValue]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&display=swap');
      html, body {
        margin: 0;
        padding: 0;
        background-color: #060606 !important;
      }
      * { transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.35s ease, opacity 0.35s ease; }
      @keyframes couturePulse {
        0% { box-shadow: 0 0 0 0 rgba(160, 120, 64, 0.4); transform: scale(1); }
        70% { box-shadow: 0 0 0 15px rgba(160, 120, 64, 0); transform: scale(1.03); }
        100% { box-shadow: 0 0 0 0 rgba(160, 120, 64, 0); transform: scale(1); }
      }
      .whatsapp-luxe-pulse { animation: couturePulse 2.5s infinite ease-in-out; }
      .reveal-section { opacity: 0; transform: translateY(40px); animation: sectionFadeUp 0.9s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
      @keyframes sectionFadeUp { to { opacity: 1; transform: translateY(0); } }
    `;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  // ─── LISTENER DE SCROLL NATIVO DEL NAVEGADOR (web solamente) ───────────
  // En Expo Web, el ScrollView principal hace scroll del document completo.
  // El onScroll del componente NO dispara en ese caso.
  // Este listener captura el scroll del window y actualiza navScrolled.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onWindowScroll = () => {
      const y = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      setNavScrolled(y > 80);
    };
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', onWindowScroll);
  }, []);

  const renderNavbar = () => (
    <Animated.View style={[styles.navBar, animatedNavBarStyle, !esPantallaGrande && { paddingHorizontal: 12 }]}>
      <TouchableOpacity onPress={() => setVista('home')}>
        <Text style={[styles.logoText, !esPantallaGrande && { fontSize: 16, letterSpacing: 3 }]}>INMOVIRAL</Text>
      </TouchableOpacity>

      {esPantallaGrande && (
        <View style={styles.navLinksRow}>
          <TouchableOpacity onPress={() => setVista('venta')} onMouseEnter={() => setHoveredNav('venta')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'venta' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'venta' && styles.activeNavLink]}>{t('navbar.buy')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('renta')} onMouseEnter={() => setHoveredNav('renta')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'renta' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'renta' && styles.activeNavLink]}>{t('navbar.rent')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('remates')} onMouseEnter={() => setHoveredNav('remates')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'remates' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'remates' && styles.activeNavLink]}>{t('navbar.remates', { defaultValue: 'REMATES BANCARIOS' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('servicios')} onMouseEnter={() => setHoveredNav('servicios')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'servicios' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'servicios' && styles.activeNavLink]}>{t('navbar.services')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setVista('nosotros')} onMouseEnter={() => setHoveredNav('nosotros')} onMouseLeave={() => setHoveredNav(null)} style={[hoveredNav === 'nosotros' && styles.navLinkItemHovered]}>
            <Text style={[styles.navLink, vista === 'nosotros' && styles.activeNavLink]}>{t('navbar.about')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={[styles.navActions, !esPantallaGrande && { gap: 8 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginRight: 8 }}>
          {/* Campana de Notificaciones (Solo si hay sesión) */}
          {user && (
            <View style={{ position: 'relative', zIndex: 100 }}>
              <TouchableOpacity onPress={() => setNotifDropdownAbierto(!notifDropdownAbierto)} style={{ position: 'relative', padding: 4 }}>
                <FontAwesome5 name="bell" size={16} color={_navbarTransparent ? '#fff' : '#A07840'} />
                {notificaciones.some(n => !n.leido) && (
                  <View style={{ position: 'absolute', top: 0, right: -2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#EF4444', borderWidth: 1.5, borderColor: _navbarTransparent ? 'rgba(0,0,0,0.4)' : '#060606', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
                    <Text style={{ color: '#fff', fontSize: 8, fontWeight: '800' }}>{notificaciones.filter(n => !n.leido).length}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {showNotifMenu && (
                <Animated.View style={{ 
                  position: 'absolute', top: 32, right: -10, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', borderRadius: 4, width: 280, overflow: 'hidden',
                  opacity: notifAnim,
                  transform: [{ translateY: notifAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 0] }) }]
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)', backgroundColor: '#151515' }}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                      {idiomaActual.startsWith('es') ? 'Notificaciones' : 'Notifications'}
                    </Text>
                    {notificaciones.length > 0 && (
                      <TouchableOpacity onPress={borrarTodasLasNotificaciones} style={{ padding: 2 }}>
                        <Text style={{ color: '#C05050', fontSize: 9, fontWeight: '600' }}>
                          {idiomaActual.startsWith('es') ? 'BORRAR TODAS' : 'CLEAR ALL'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                    {(() => {
                      const isAdminOrMod = user?.isAdmin || user?.isModerator || user?.email === 'ventas@inmoviral.com.mx';
                      const pendientes = notificaciones.filter(n => n.tipo === 'revision');
                      const regulares = notificaciones.filter(n => n.tipo !== 'revision');
                      
                      return (
                        <>
                          {/* ═══ SECCIÓN: PENDIENTES DE APROBACIÓN (solo admin/mod) ═══ */}
                          {isAdminOrMod && pendientes.length > 0 && (
                            <View>
                              <View style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                paddingVertical: 8, 
                                paddingHorizontal: 12, 
                                backgroundColor: 'rgba(160,120,64,0.08)',
                                borderBottomWidth: 1,
                                borderBottomColor: 'rgba(160,120,64,0.15)',
                              }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <FontAwesome5 name="clipboard-check" size={10} color="#A07840" />
                                  <Text style={{ color: '#A07840', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                                    {idiomaActual.startsWith('es') ? 'Pendientes de Aprobación' : 'Pending Approval'}
                                  </Text>
                                </View>
                                <View style={{ 
                                  backgroundColor: '#A07840', 
                                  borderRadius: 8, 
                                  minWidth: 18, 
                                  height: 18, 
                                  alignItems: 'center', 
                                  justifyContent: 'center',
                                  paddingHorizontal: 5,
                                }}>
                                  <Text style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>{pendientes.length}</Text>
                                </View>
                              </View>
                              {pendientes.map((notif, idx) => (
                                <TouchableOpacity 
                                  key={notif.id || idx}
                                  onPress={() => handleNotifPress(notif)}
                                  style={{ 
                                    paddingVertical: 10,
                                    paddingHorizontal: 12,
                                    borderBottomWidth: 1, 
                                    borderBottomColor: 'rgba(160,120,64,0.08)', 
                                    backgroundColor: !notif.leido ? 'rgba(160,120,64,0.06)' : 'transparent',
                                    borderLeftWidth: 3,
                                    borderLeftColor: '#A07840',
                                  }}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: !notif.leido ? '#A07840' : '#fff', fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                                      {idiomaActual.startsWith('es') ? notif.titulo : notif.tituloEn}
                                    </Text>
                                    <Text style={{ color: '#aaa', fontSize: 10, lineHeight: 14 }}>
                                      {idiomaActual.startsWith('es') ? notif.descripcion : notif.descripcionEn}
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                                      <TouchableOpacity
                                        onPress={async (e) => {
                                          e.stopPropagation();
                                          await handleAprobarPropiedadDesdeNotif(notif);
                                        }}
                                        style={{
                                          backgroundColor: '#A07840',
                                          paddingVertical: 5,
                                          paddingHorizontal: 12,
                                          borderRadius: 2,
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}
                                      >
                                        <FontAwesome5 name="check" size={8} color="#000" />
                                        <Text style={{ color: '#000', fontSize: 8.5, fontWeight: '700' }}>
                                          {idiomaActual.startsWith('es') ? 'APROBAR' : 'APPROVE'}
                                        </Text>
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        onPress={(e) => {
                                          e.stopPropagation();
                                          handleRechazarPropiedadDesdeNotif(notif);
                                        }}
                                        style={{
                                          backgroundColor: 'rgba(239,68,68,0.15)',
                                          paddingVertical: 5,
                                          paddingHorizontal: 12,
                                          borderRadius: 2,
                                          borderWidth: 1,
                                          borderColor: 'rgba(239,68,68,0.3)',
                                          flexDirection: 'row',
                                          alignItems: 'center',
                                          gap: 4,
                                        }}
                                      >
                                        <FontAwesome5 name="times" size={8} color="#EF4444" />
                                        <Text style={{ color: '#EF4444', fontSize: 8.5, fontWeight: '700' }}>
                                          {idiomaActual.startsWith('es') ? 'RECHAZAR' : 'REJECT'}
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {/* ═══ SECCIÓN: NOTIFICACIONES REGULARES ═══ */}
                          {regulares.length > 0 && isAdminOrMod && pendientes.length > 0 && (
                            <View style={{ 
                              paddingVertical: 8, 
                              paddingHorizontal: 12, 
                              backgroundColor: '#151515',
                              borderBottomWidth: 1,
                              borderBottomColor: 'rgba(255,255,255,0.05)',
                            }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <FontAwesome5 name="bell" size={9} color="#888" />
                                <Text style={{ color: '#888', fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>
                                  {idiomaActual.startsWith('es') ? 'Otras Notificaciones' : 'Other Notifications'}
                                </Text>
                              </View>
                            </View>
                          )}

                          {regulares.length === 0 && pendientes.length === 0 ? (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                              <Text style={{ color: '#888', fontSize: 11, fontStyle: 'italic' }}>
                                {idiomaActual.startsWith('es') ? 'Sin notificaciones' : 'No notifications'}
                              </Text>
                            </View>
                          ) : (
                            regulares.map((notif, idx) => (
                              <TouchableOpacity 
                                key={notif.id || idx}
                                onPress={() => handleNotifPress(notif)}
                                style={{ 
                                  paddingVertical: 10,
                                  paddingHorizontal: 12,
                                  borderBottomWidth: idx < regulares.length - 1 ? 1 : 0, 
                                  borderBottomColor: 'rgba(255,255,255,0.05)', 
                                  backgroundColor: !notif.leido ? 'rgba(160,120,64,0.06)' : 'transparent',
                                  borderLeftWidth: !notif.leido ? 3 : 0,
                                  borderLeftColor: '#A07840',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <View style={{ flex: 1, paddingRight: 8 }}>
                                  <Text style={{ color: !notif.leido ? '#A07840' : '#fff', fontSize: 10, fontWeight: '700', marginBottom: 2 }}>
                                    {idiomaActual.startsWith('es') ? notif.titulo : notif.tituloEn}
                                  </Text>
                                  <Text style={{ color: '#aaa', fontSize: 10, lineHeight: 14 }}>
                                    {idiomaActual.startsWith('es') ? notif.descripcion : notif.descripcionEn}
                                  </Text>
                                </View>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  {!notif.leido && (
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#A07840' }} />
                                  )}
                                  <TouchableOpacity 
                                    onPress={(e) => {
                                      e.stopPropagation();
                                      borrarNotificacion(notif.id);
                                    }}
                                    style={{ padding: 4 }}
                                  >
                                    <Feather name="trash-2" size={11} color="#C05050" style={{ opacity: 0.8 }} />
                                  </TouchableOpacity>
                                </View>
                              </TouchableOpacity>
                            ))
                          )}
                        </>
                      );
                    })()}
                  </ScrollView>
                </Animated.View>
              )}
            </View>
          )}

          {/* Listbox de Idioma */}
          <View style={{ position: 'relative', zIndex: 100 }}>
            <TouchableOpacity 
              onPress={() => setLangDropdownAbierto(!langDropdownAbierto)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 4, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)' }}
            >
              <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{idiomaActual.substring(0, 2).toUpperCase()}</Text>
              <FontAwesome5 name="chevron-down" size={10} color="#A07840" />
            </TouchableOpacity>

            {showLangMenu && (
              <Animated.View style={{ 
                position: 'absolute', top: 32, right: 0, backgroundColor: '#111', borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)', borderRadius: 4, width: 60, overflow: 'hidden',
                opacity: langAnim,
                transform: [{ translateY: langAnim.interpolate({ inputRange: [0, 1], outputRange: [-5, 0] }) }]
              }}>
                <TouchableOpacity onPress={() => { cambiarIdioma('es'); setLangDropdownAbierto(false); }} style={{ paddingVertical: 8, backgroundColor: idiomaActual.startsWith('es') ? '#A07840' : 'transparent' }}>
                  <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: idiomaActual.startsWith('es') ? '700' : '400' }}>ES</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { cambiarIdioma('en'); setLangDropdownAbierto(false); }} style={{ paddingVertical: 8, backgroundColor: idiomaActual.startsWith('en') ? '#A07840' : 'transparent' }}>
                  <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center', fontWeight: idiomaActual.startsWith('en') ? '700' : '400' }}>EN</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </View>

        {user ? (
          <View style={[styles.navAuthenticatedRow, !esPantallaGrande && { gap: 8 }]}>
            <TouchableOpacity
              style={[
                styles.navPublishBtn,
                hoveredPublishNav && styles.navPublishBtnHover,
                vista === 'vendedor' && styles.navPublishBtnActive,
                !esPantallaGrande && { paddingHorizontal: 8, marginRight: 0 }
              ]}
              disabled={vista === 'vendedor'}
              onPress={() => setVista('vendedor')}
              onMouseEnter={() => Platform.OS === 'web' && vista !== 'vendedor' && setHoveredPublishNav(true)}
              onMouseLeave={() => Platform.OS === 'web' && setHoveredPublishNav(false)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather
                  name="plus"
                  size={12}
                  color={vista === 'vendedor' ? '#525252' : hoveredPublishNav ? '#C39B5F' : '#A07840'}
                />
                {esPantallaGrande && (
                  <Text style={[
                    styles.navPublishBtnText,
                    hoveredPublishNav && styles.navPublishBtnTextHover,
                    vista === 'vendedor' && styles.navPublishBtnTextActive,
                    { marginLeft: 5 }
                  ]}>
                    {idiomaActual.startsWith('es') ? 'PUBLICAR' : 'PUBLISH'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navAvatarCircle} onPress={() => setUserMenuAbierto(true)}>
              {user?.user_metadata?.avatar_url ? (
                <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.navAvatarImage} />
              ) : (
                <Text style={styles.navAvatarText}>{obtenerIniciales()}</Text>
              )}
              {isUserPlus && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#0C0C0C', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#A07840', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2 }}>
                  <FontAwesome5 name="crown" size={8} color="#A07840" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.hamMenuButtonAuthenticated} onPress={() => esPantallaGrande ? setUserMenuAbierto(true) : setMobileNavAbierto(true)}>
              <Text style={styles.hamMenuButtonIcon}>☰</Text>
            </TouchableOpacity>
          </View>
        ) : (
          esPantallaGrande ? (
            <TouchableOpacity style={[styles.btnCta, hoveredLogin && styles.btnCtaHover]} onPress={() => setVista('login')} onMouseEnter={() => setHoveredLogin(true)} onMouseLeave={() => setHoveredLogin(false)}>
              <Text style={[styles.btnCtaText, hoveredLogin && styles.btnCtaHoverText]}>{t('navbar.login')}</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity style={styles.btnCtaMobile} onPress={() => setVista('login')}>
                <Text style={styles.btnCtaMobileText}>{t('navbar.login')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.hamMenuButton} onPress={() => setMobileNavAbierto(true)}>
                <Text style={styles.hamMenuButtonIcon}>☰</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>
    </Animated.View>
  );

  const renderLuxuryMobileMenu = () => {
    if (!mobileNavAbierto || esPantallaGrande) return null;
    return (
      <View style={styles.luxuryOverlayMenu}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.luxuryMenuHeader}>
            <Text style={styles.logoText}>INMOVIRAL</Text>

            <View style={[styles.langContainer, { marginRight: 12 }]}>
              <TouchableOpacity onPress={() => cambiarIdioma('es')} style={[styles.langBtn, idiomaActual.startsWith('es') && styles.langBtnActive]}><Text style={styles.langText}>ES</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => cambiarIdioma('en')} style={[styles.langBtn, idiomaActual.startsWith('en') && styles.langBtnActive]}><Text style={styles.langText}>EN</Text></TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setMobileNavAbierto(false)} style={styles.closeMenuBtn}><Text style={styles.closeMenuBtnText}>✕</Text></TouchableOpacity>
          </View>
          <View style={styles.luxuryMenuLinksContainer}>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('venta')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>01</Text><Text style={[styles.luxuryMenuLinkText, vista === 'venta' && styles.luxuryActiveLink]}>{t('navbar.buy')}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('renta')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>02</Text><Text style={[styles.luxuryMenuLinkText, vista === 'renta' && styles.luxuryActiveLink]}>{t('navbar.rent')}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('remates')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>03</Text><Text style={[styles.luxuryMenuLinkText, vista === 'remates' && styles.luxuryActiveLink]}>{t('navbar.remates', { defaultValue: 'REMATES BANCARIOS' })}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('servicios')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>04</Text><Text style={[styles.luxuryMenuLinkText, vista === 'servicios' && styles.luxuryActiveLink]}>{t('navbar.services')}</Text></View></TouchableOpacity>
            <TouchableOpacity style={styles.luxuryMenuLinkWrap} onPress={() => navegacionMovil('nosotros')}><View style={styles.luxuryMenuFlexRow}><Text style={styles.luxuryMenuIndex}>05</Text><Text style={[styles.luxuryMenuLinkText, vista === 'nosotros' && styles.luxuryActiveLink]}>{t('navbar.about')}</Text></View></TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  if (vista === 'login') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <ScrollView contentContainerStyle={{ paddingTop: 0 }} keyboardShouldPersistTaps="handled">
        <LoginPage onVolver={() => setVista('home')} />
        <Footer onNavigate={navegarA} />
      </ScrollView>
    </SafeAreaView>
  );
  if (vista === 'venta') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<PropiedadesVenta key="venta" onVerPropiedad={irAPropiedad} onNavigate={navegarA} onScroll={handleScrollPages} /></SafeAreaView>;
  if (vista === 'renta') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<PropiedadesRenta key="renta" onVerPropiedad={irAPropiedad} onNavigate={navegarA} onScroll={handleScrollPages} /></SafeAreaView>;
  if (vista === 'remates') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<PropiedadesVenta key="remates" onVerPropiedad={irAPropiedad} soloRemates={true} onNavigate={navegarA} onScroll={handleScrollPages} /></SafeAreaView>;
  if (vista === 'propiedad') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<VerPropiedad propiedadId={propiedadSeleccionada} onVolver={volverDePropiedad} onStartChat={(roomId) => { setChatRoomId(roomId); setVista('chat'); }} onEditarPropiedad={(prop) => { setPropiedadParaEditar(prop); setVista('vendedor'); }} /></SafeAreaView>;
  if (vista === 'servicios') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<ServiciosVirales onIrLogin={() => setVista('login')} onVolver={() => setVista('home')} onNavigate={navegarA} user={user} isUserPlus={isUserPlus} onScroll={handleScrollPages} /></SafeAreaView>;
  if (vista === 'vendedor') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<Vendedor propiedadParaEditar={propiedadParaEditar} onVolver={() => { setPropiedadParaEditar(null); if (user) { setVista('dashboard'); setDashboardTab('publicaciones'); } else { setVista('home'); } }} onVerPropiedadPublicada={(id) => irAPropiedad(id)} /></SafeAreaView>;
  if (vista === 'nosotros') return <SafeAreaView style={styles.screen}><StatusBar barStyle="light-content" />{renderNavbar()}<UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />{renderLuxuryMobileMenu()}<SobreNosotros onIrServicios={() => setVista('servicios')} onIrPropiedades={() => setVista('venta')} onNavigate={navegarA} scrollToSection={sobreNosotrosSection} onScroll={handleScrollPages} /></SafeAreaView>;

  if (vista === 'resenas') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Resenas onVolver={() => setVista('home')} />
    </SafeAreaView>
  );

  if (vista === 'chat') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Chat initialRoomId={chatRoomId} onVolver={() => { setChatRoomId(null); setVista('home'); }} />
    </SafeAreaView>
  );

  if (vista === 'perfil') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Perfil onVolver={() => setVista('home')} />
    </SafeAreaView>
  );

  if (vista === 'configuracion') return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}
      <Configuracion onVolver={() => setVista('home')} />
    </SafeAreaView>
  );

  if (vista === 'dashboard') {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        {renderNavbar()}
        <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
        {renderLuxuryMobileMenu()}
        <Dashboard
          activeTab={dashboardTab}
          setActiveTab={setDashboardTab}
          onPublicar={() => {
            setPropiedadParaEditar(null);
            setVista('vendedor');
          }}
          onEditarPropiedad={(propiedad) => {
            setPropiedadParaEditar(propiedad);
            setVista('vendedor');
          }}
          onVolver={() => setVista('home')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      {renderNavbar()}
      <UserMenu isOpen={userMenuAbierto} onClose={() => setUserMenuAbierto(false)} user={user} isUserPlus={isUserPlus} vistaActual={vista} dashboardTab={dashboardTab} setVista={setVista} setDashboardTab={setDashboardTab} onSignOut={async () => { setUserMenuAbierto(false); setVista('home'); await signOut(); }} />
      {renderLuxuryMobileMenu()}

      <View style={{ flex: 1, backgroundColor: '#060606' }}>
      <Animated.View style={{ flex: 1, opacity: homeFadeAnim }}>
      <Animated.ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* ══ 1. HERO ══ */}
        <View style={[styles.heroSection, width <= 768 && { height: undefined, minHeight: 650, paddingVertical: 100 }]}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=85" }} style={styles.heroBg} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroBody}>
            <Text style={styles.heroTag}>{t('hero.tag')}</Text>
            <Text style={[styles.heroTitle, { fontSize: width > 768 ? 56 : 28, lineHeight: width > 768 ? 72 : 42 }]}>
              {t('hero.title_part1')}{'\n'}
              <Text style={styles.heroTitleItalic}>{t('hero.title_italic')}</Text> {'\n'}
              {t('hero.title_part2')}
            </Text>
            <Text style={styles.heroDesc}>{t('hero.description')}</Text>
            <View style={[
              styles.heroActionsRow,
              !esPantallaGrande && {
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 12,
                width: '100%'
              }
            ]}>
              <TouchableOpacity
                style={[
                  styles.btnPrimary,
                  hoveredHeroBtn && styles.btnPrimaryHovered,
                  !esPantallaGrande && { width: '100%', alignItems: 'center', paddingVertical: 14 }
                ]}
                onPress={() => setVista('venta')}
                onMouseEnter={() => setHoveredHeroBtn(true)}
                onMouseLeave={() => setHoveredHeroBtn(false)}
              >
                <Text style={[styles.btnTextBlack, { textAlign: 'center' }]}>{t('hero.cta_portfolio')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.btnGhost,
                  !esPantallaGrande && { width: '100%', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14 }
                ]}
                onPress={() => setVista('servicios')}
              >
                <Text style={[styles.btnTextWhite, { textAlign: 'center' }]}>{t('hero.cta_clients')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[
            styles.heroCounterBar,
            width <= 768 && {
              position: 'relative',
              bottom: undefined,
              left: undefined,
              right: undefined,
              marginTop: 40,
              flexDirection: 'row',
              justifyContent: 'space-around',
              gap: 16
            }
          ]}>
            <View style={styles.hcItem}><Text style={styles.hcNum}>0{countYears}</Text><Text style={styles.hcLabel}>{t('hero.counter_years')}</Text></View>
            <View style={styles.hcItem}><Text style={styles.hcNum}>{countProps}+</Text><Text style={styles.hcLabel}>{t('hero.counter_sold')}</Text></View>
            <View style={styles.hcItem}><Text style={styles.hcNum}>5</Text><Text style={styles.hcLabel}>{t('hero.counter_satisfied')}</Text></View>
          </View>
        </View>

        {/* ══ 2. TICKER MARQUEE ══ */}
        <View style={styles.tickerBar}>
          <Animated.View style={[styles.tickerInnerLoop, { transform: [{ translateX: tickerValue }] }]}>
            {[...TICKER_PHRASES, ...TICKER_PHRASES, ...TICKER_PHRASES].map((phrase, idx) => (
              <View key={idx} style={styles.tickerItem}>
                <Text style={styles.tickerText}>{phrase}</Text>
                <Text style={styles.tickerSeparator}>✦</Text>
              </View>
            ))}
          </Animated.View>
        </View>

        {/* ══ 3. FEATURES SECTOR ══ */}
        <View className="reveal-section" style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            {[
              { id: 1, json_base: 'features.residential', svg: <path d="M3 21h4v-4H3v4zm0-6h4v-4H3v4zm6 6h4v-6H9v6zm0-10h4V7H9v4zm6 10h4V11h-4v10zm0-12h4V3h-4v6z" /> },
              { id: 2, json_base: 'features.premium', svg: <><rect x="2" y="6" width="20" height="14" rx="1" /><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><line x1="12" y1="11" x2="12" y2="16" /><line x1="9.5" y1="13.5" x2="14.5" y2="13.5" /></> },
              { id: 3, json_base: 'features.investment', svg: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /> },
              { id: 4, json_base: 'features.advisory', svg: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /> }
            ].map((feat, idx) => (
              <View key={feat.id} style={[styles.featureItem, { width: width > 1024 ? '23%' : width > 640 ? '47%' : '100%' }, hoveredFeatureIdx === idx && styles.featureItemHovered]} onMouseEnter={() => setHoveredFeatureIdx(idx)} onMouseLeave={() => setHoveredFeatureIdx(null)}>
                <Text style={styles.featureNum}>0{feat.id}</Text>
                <View style={styles.featureIconWrap}>
                  {Platform.OS === 'web' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#A07840" strokeWidth="1.2" strokeLinecap="round" style={{ width: 24, height: 24 }}>{feat.svg}</svg>
                  ) : (<View style={{ width: 24, height: 24, backgroundColor: 'rgba(160,120,64,0.1)' }} />)}
                </View>
                <Text style={styles.featureTitle}>{t(`${feat.json_base}.t1`)} {t(`${feat.json_base}.t2`)}</Text>
                <Text style={styles.featureText}>{t(`${feat.json_base}.d`)}</Text>
                <View style={[styles.cardGoldIndicator, hoveredFeatureIdx === idx && styles.cardGoldIndicatorActive]} />
              </View>
            ))}
          </View>
        </View>

        {/* ══ 4. NUESTRAS SOLUCIONES ══ */}
        <View className="reveal-section">
          <NuestrasSoluciones onNavigate={(destino) => setVista(destino)} />
        </View>

        {/* ══ 5. PROPIEDADES DESTACADAS ══ */}
        <View className="reveal-section" style={styles.featuredPropsSection}>
          <Text style={styles.featuredPropsLabel}>{idiomaActual.startsWith('es') ? 'COLECCIÓN EXCLUSIVA' : 'EXCLUSIVE COLLECTION'}</Text>
          <Text style={styles.featuredPropsTitle}>{idiomaActual.startsWith('es') ? 'Propiedades Destacadas' : 'Featured Properties'}</Text>

          <View style={[styles.sliderWrapper, { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 1220, alignSelf: 'center' }]}>
            {totalPaginas > 1 && (
              <TouchableOpacity 
                disabled={paginaActual === 1} 
                onPress={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                style={[
                  styles.sliderArrowBtn, 
                  paginaActual === 1 && styles.sliderArrowBtnDisabled,
                  { marginRight: width > 768 ? 20 : 8 }
                ]}
              >
                <Feather name="chevron-left" size={24} color={paginaActual === 1 ? 'rgba(255,255,255,0.15)' : '#A07840'} />
              </TouchableOpacity>
            )}

            <View style={[styles.propsGrid, { flex: 1 }]}>
              {listaPropiedadesPaginada.map((prop) => {
                const isHovered = hoveredPropertyId === prop.id;
                return (
                  <TouchableOpacity
                    key={prop.id}
                    style={[styles.propCardItem, { width: width > 1024 ? '31%' : width > 640 ? '47%' : '100%' }]}
                    onPress={() => irAPropiedad(prop.id)}
                    onMouseEnter={() => Platform.OS === 'web' && setHoveredPropertyId(prop.id)}
                    onMouseLeave={() => Platform.OS === 'web' && setHoveredPropertyId(null)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.propCardImageWrap}>
                      <Image
                        source={{ uri: prop.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600' }}
                        style={[
                          styles.propCardImage,
                          isHovered && styles.propCardImageZoomed
                        ]}
                        resizeMode="cover"
                      />
                      <View style={styles.propOperationTag}>
                        <Text style={styles.propOperationText}>
                          {prop.operacion?.toUpperCase() === 'RENTA' ? (idiomaActual.startsWith('es') ? 'RENTA' : 'RENT') : (idiomaActual.startsWith('es') ? 'VENTA' : 'SALE')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.propCardInfo}>
                      <Text style={styles.propCardTitle} numberOfLines={1}>
                        {prop.titulo}
                      </Text>
                      <Text style={styles.propCardPrice}>
                        ${formatPrecioHome(prop.price || prop.precio)} MXN
                      </Text>
                      <Text style={styles.propCardLocation} numberOfLines={1}>
                        📍 {prop.ubicacion}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {totalPaginas > 1 && (
              <TouchableOpacity 
                disabled={paginaActual === totalPaginas} 
                onPress={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                style={[
                  styles.sliderArrowBtn, 
                  paginaActual === totalPaginas && styles.sliderArrowBtnDisabled,
                  { marginLeft: width > 768 ? 20 : 8 }
                ]}
              >
                <Feather name="chevron-right" size={24} color={paginaActual === totalPaginas ? 'rgba(255,255,255,0.15)' : '#A07840'} />
              </TouchableOpacity>
            )}
          </View>

          {/* Page indicator at the bottom center */}
          {totalPaginas > 1 && (
            <View style={styles.sliderPageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {paginaActual} / {totalPaginas}
              </Text>
            </View>
          )}
        </View>

        {/* ══ 5b. MAPA INTERACTIVO DE PROPIEDADES ══ */}
        <View className="reveal-section" style={styles.mapSection}>
          <Text style={styles.featuredPropsLabel}>{idiomaActual.startsWith('es') ? 'UBICACIONES EXCLUSIVAS' : 'EXCLUSIVE LOCATIONS'}</Text>
          <Text style={styles.featuredPropsTitle}>{idiomaActual.startsWith('es') ? 'Explora en el Mapa' : 'Explore on the Map'}</Text>
          <View style={styles.mapContainer}>
            <InteractiveMap 
              propiedades={propiedadesMapa} 
              onSelectProperty={irAPropiedad} 
              user={user}
              onRequireLogin={() => setVista('login')}
              onDeleteProperty={(id) => setPropiedades(prev => prev.filter(p => p.id !== id))}
            />
          </View>
        </View>

        {/* ══ NUESTRO PROCESO ══ */}
        <View className="reveal-section">
          <NuestroProceso />
        </View>

        {/* ══ 6. SOBRE NOSOTROS ══ */}
        <View className="reveal-section">
          <SobreNosotrosSection onNavigate={(destino) => setVista(destino)} />
        </View>

        {/* ══ TESTIMONIOS ══ */}
        <View className="reveal-section">
          <Testimonios onNavigate={(destino) => setVista(destino)} />
        </View>

        {/* ══ 6. FINAL CTA BANNER ══ */}
        <View style={styles.finalCtaSection}>
          <Image source={{ uri: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1600" }} style={styles.ctaBgImage} />
          <View style={styles.ctaDarkLayer} />
          <View style={styles.ctaContentWrapper}>
            <Text style={styles.ctaSubLabel}>{t('cta.label')}</Text>
            <Text style={styles.ctaMainTitle}>{t('cta.title')}</Text>
            <TouchableOpacity style={[styles.ctaGoldButton, hoveredCtaBtn && styles.ctaGoldButtonHovered]} onPress={() => setVista('venta')} onMouseEnter={() => setHoveredCtaBtn(true)} onMouseLeave={() => setHoveredCtaBtn(false)}>
              <Text style={[styles.ctaGoldButtonText, hoveredCtaBtn && styles.ctaGoldButtonTextHover]}>{t('cta.cta_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* FOOTER */}
        <Footer onNavigate={navegarA} />

      </Animated.ScrollView>
      </Animated.View>
      </View>

      {showNotifRejectModal && (
        <View style={{
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
        }}>
          <View style={{
            backgroundColor: '#121212',
            borderWidth: 1,
            borderColor: 'rgba(160,120,64,0.3)',
            padding: 24,
            width: '90%',
            maxWidth: 400,
            borderRadius: 4,
          }}>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
              fontSize: 16,
              color: '#fff',
              letterSpacing: 2,
              marginBottom: 12,
              textAlign: 'center',
            }}>{idiomaActual.startsWith('es') ? 'RECHAZAR PUBLICACIÓN' : 'REJECT PROPERTY'}</Text>
            <Text style={{
              fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
              fontSize: 12,
              color: '#8A8A84',
              lineHeight: 18,
              marginBottom: 20,
              textAlign: 'center',
            }}>
              {idiomaActual.startsWith('es') 
                ? 'Ingresa el motivo por el cual se rechaza esta publicación. Este motivo le aparecerá al vendedor en sus notificaciones.'
                : 'Enter the reason for rejecting this property. This reason will appear to the seller in their notifications.'}
            </Text>
            <TextInput
              style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderWidth: 1,
                borderColor: 'rgba(160,120,64,0.15)',
                color: '#fff',
                fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
                fontSize: 13,
                padding: 12,
                minHeight: 80,
                marginBottom: 20,
              }}
              value={notifRejectReason}
              onChangeText={setNotifRejectReason}
              placeholder={idiomaActual.startsWith('es') ? 'Motivo del rechazo...' : 'Reason for rejection...'}
              placeholderTextColor="rgba(255,255,255,0.3)"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
            }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 2,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.15)',
                }} 
                onPress={() => { setShowNotifRejectModal(false); setNotifRejectProp(null); }}
              >
                <Text style={{ color: '#8A8A84', fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>{idiomaActual.startsWith('es') ? 'Cancelar' : 'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderRadius: 2,
                  backgroundColor: '#EF4444',
                }} 
                onPress={confirmRechazoDesdeNotif}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>{idiomaActual.startsWith('es') ? 'Confirmar Rechazo' : 'Confirm Rejection'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

export default function App() { return <AuthProvider><MainApp /></AuthProvider>; }

/* ─────────────────────────────────────────────
   💎 ESTILOS COMPLEMENTARIOS SANEADOS CONTRA CRASHES NATÍVOS
───────────────────────────────────────────── */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060606' },
  scrollContainer: { paddingBottom: 0 },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    ...Platform.select({
      web: { position: 'fixed' },
      default: { position: 'absolute' }
    }),
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    borderBottomWidth: 1,
  },
  logoText: { fontFamily: LUXURY_FONT, fontSize: 24, fontWeight: '400', color: '#fff', letterSpacing: 7.5, textTransform: 'uppercase' },
  logoImage: { height: 36, width: 160 },
  navLinksRow: { flexDirection: 'row', gap: 28 },
  navLink: { color: '#a3a3a3', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  navLinkItemHovered: { transform: [{ scale: 1.04 }] },
  activeNavLink: { color: '#A07840' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  btnCta: { borderWidth: 1, borderColor: 'rgba(160,120,64,0.6)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 1 },
  btnCtaHover: { backgroundColor: '#A07840', borderColor: '#A07840' },
  btnCtaText: { color: '#A07840', fontSize: 11, fontWeight: '400', letterSpacing: 2 },
  btnCtaHoverText: { color: '#000000', fontWeight: '700' },
  btnCtaMobile: {
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.6)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 1,
  },
  btnCtaMobileText: {
    color: '#A07840',
    fontSize: 9,
    fontWeight: '400',
    letterSpacing: 1.5,
    fontFamily: SANS_FONT,
  },
  langContainer: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 1, alignItems: 'center' },
  langBtn: { paddingVertical: 5, paddingHorizontal: 10 },
  langBtnActive: { backgroundColor: '#A07840' },
  langText: { color: '#fff', fontSize: 9, fontWeight: '600' },

  navAuthenticatedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },

  navPublishBtn: {
    borderWidth: 1,
    borderColor: '#A07840',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 2,
    marginRight: 4,
    backgroundColor: 'transparent',
  },
  navPublishBtnHover: {
    backgroundColor: 'rgba(160, 120, 64, 0.1)',
    borderColor: '#C39B5F',
  },
  navPublishBtnActive: {
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  navPublishBtnText: {
    color: '#A07840',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: SANS_FONT
  },
  navPublishBtnTextHover: {
    color: '#C39B5F',
  },
  navPublishBtnTextActive: {
    color: '#525252',
  },

  navAvatarCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#A07840', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  navAvatarImage: { width: '100%', height: '100%', borderRadius: 17 },
  navAvatarText: { color: '#F2EDE5', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  hamMenuButtonAuthenticated: { padding: 4 },
  hamMenuButton: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1, borderColor: 'rgba(160,120,64,0.3)' },
  hamMenuButtonIcon: { color: '#A07840', fontSize: 16 },

  heroSection: { height: 750, justifyContent: 'center', paddingHorizontal: 24, position: 'relative' },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,6,0.75)' },
  heroBody: { zIndex: 10, maxWidth: 850 },
  heroTag: { color: '#A07840', fontSize: 10, fontWeight: '600', letterSpacing: 4, marginBottom: 25 },
  heroTitle: { fontFamily: LUXURY_FONT, fontSize: Platform.OS === 'web' ? 56 : 28, color: '#fff', lineHeight: Platform.OS === 'web' ? 72 : 42, letterSpacing: 3 },
  heroTitleItalic: { fontStyle: 'italic', color: '#fff' },
  heroDesc: { color: '#94a3b8', fontSize: 13, lineHeight: 24, marginVertical: 30, maxWidth: 520 },
  heroActionsRow: { flexDirection: 'row', gap: 16 },
  btnPrimary: { backgroundColor: '#A07840', paddingVertical: 16, paddingHorizontal: 24, borderRadius: 1 },
  btnGhost: { paddingVertical: 16, paddingHorizontal: 5 },
  btnTextBlack: { color: '#000', fontWeight: '700', fontSize: 11, letterSpacing: 2 },
  btnTextWhite: { color: '#e5e5e5', fontWeight: '500', fontSize: 11, letterSpacing: 2 },
  heroCounterBar: { position: 'absolute', bottom: 50, left: 50, right: 50, flexDirection: 'row', gap: 80 },
  hcItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  hcNum: { fontFamily: SERIF_FONT, fontSize: 34, color: '#fff' },
  hcLabel: { color: '#737373', fontSize: 9, letterSpacing: 2, maxWidth: 110 },
  tickerBar: { backgroundColor: '#A07840', paddingVertical: 18, overflow: 'hidden' },
  tickerInnerLoop: { flexDirection: 'row', width: 5000 },
  tickerItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 48 },
  tickerText: { fontFamily: SANS_FONT, color: '#ffffff', fontSize: 11, fontWeight: '400', letterSpacing: 2.5, textTransform: 'uppercase' },
  tickerSeparator: { fontSize: 8, color: '#ffffff', opacity: 0.6, marginLeft: 48 },
  featuresSection: { paddingVertical: 100, paddingHorizontal: 24, backgroundColor: '#ffffff' },
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, justifyContent: 'center' },
  featureItem: { minWidth: 260, padding: 35, backgroundColor: '#ffffff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  featureItemHovered: { backgroundColor: '#efede7' },
  featureNum: { fontSize: 12, color: '#A07840', fontWeight: '600', marginBottom: 25 },
  featureIconWrap: { marginBottom: 20 },
  featureTitle: { fontFamily: SERIF_FONT, fontSize: 24, color: '#0a0a0a', marginBottom: 18 },
  featureText: { color: '#525252', fontSize: 13, lineHeight: 22 },
  cardGoldIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 0, backgroundColor: '#A07840' },
  cardGoldIndicatorActive: { height: 3 },
  finalCtaSection: { height: 400, position: 'relative', justifyContent: 'center', alignItems: 'center' },
  ctaBgImage: { ...StyleSheet.absoluteFillObject },
  ctaDarkLayer: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,6,0.82)' },
  ctaContentWrapper: { zIndex: 10, alignItems: 'center', paddingHorizontal: 24 },
  ctaSubLabel: { color: '#A07840', fontSize: 11, fontWeight: '600', letterSpacing: 5, marginBottom: 18 },
  ctaMainTitle: { fontFamily: LUXURY_FONT, fontSize: 42, color: '#fff', textAlign: 'center', marginBottom: 35 },
  ctaGoldButton: { borderWidth: 1, borderColor: '#A07840', paddingVertical: 18, paddingHorizontal: 36 },
  ctaGoldButtonHovered: { backgroundColor: '#A07840' },
  ctaGoldButtonText: { color: '#A07840', fontSize: 11, letterSpacing: 2 },
  ctaGoldButtonTextHover: { color: '#000000', fontWeight: '700' },

  sliderWrapper: {},
  sliderArrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#A07840',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111110',
  },
  sliderArrowBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  sliderPageIndicator: {
    alignItems: 'center',
    marginTop: 40,
  },
  pageIndicatorText: {
    color: '#FFFFFF',
    fontFamily: SANS_FONT,
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  featuredPropsSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#0a0a0a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapSection: {
    paddingVertical: 100,
    paddingHorizontal: 24,
    backgroundColor: '#060606',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  mapContainer: {
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
    marginTop: 20,
  },
  featuredPropsLabel: {
    color: '#A07840',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 5,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuredPropsTitle: {
    fontFamily: LUXURY_FONT,
    fontSize: 34,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 65,
  },
  propsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 30,
    justifyContent: 'center',
    maxWidth: 1100,
    alignSelf: 'center',
    width: '100%',
  },
  propCardItem: {
    minWidth: 280,
    backgroundColor: '#111110',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    overflow: 'hidden',
  },
  propCardImageWrap: {
    height: 220,
    overflow: 'hidden',
    position: 'relative',
  },
  propCardImage: {
    width: '100%',
    height: '100%',
  },
  propCardImageZoomed: {
    transform: [{ scale: 1.06 }],
  },
  propOperationTag: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(10, 10, 10, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(160, 120, 64, 0.3)',
  },
  propOperationText: {
    color: '#A07840',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    fontFamily: SANS_FONT,
  },
  propCardInfo: {
    padding: 20,
  },
  propCardTitle: {
    fontFamily: SERIF_FONT,
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
  },
  propCardPrice: {
    color: '#A07840',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: SANS_FONT,
    marginBottom: 8,
  },
  propCardLocation: {
    color: '#8A8A84',
    fontSize: 12,
    fontFamily: SANS_FONT,
  },

  // ══ 📱 ESTILOS EXCLUSIVOS DEL MENÚ HAMBURGUESA LUXURY ══
  luxuryOverlayMenu: {
    position: 'absolute',
    ...Platform.select({
      web: { position: 'fixed' },
      default: { position: 'absolute' }
    }),
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0C0C0C',
    zIndex: 10000,
    padding: 24,
  },
  luxuryMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40,
  },
  closeMenuBtn: {
    padding: 8,
  },
  closeMenuBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '300',
  },
  luxuryMenuLinksContainer: {
    gap: 32,
    marginTop: 20,
  },
  luxuryMenuLinkWrap: {
    paddingVertical: 12,
  },
  luxuryMenuFlexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  luxuryMenuIndex: {
    fontFamily: SANS_FONT,
    fontSize: 10,
    color: '#A07840',
    fontWeight: '500',
  },
  luxuryMenuLinkText: {
    fontFamily: LUXURY_FONT,
    fontSize: 28,
    color: '#a3a3a3',
    fontWeight: '300',
  },
  luxuryActiveLink: {
    color: '#fff',
  },
});