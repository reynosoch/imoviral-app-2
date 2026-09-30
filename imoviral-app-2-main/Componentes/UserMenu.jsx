import React, { useState, useRef, useEffect } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

/* ─────────────────────────────────────────────
   TOKENS DE DISEÑO
   ───────────────────────────────────────────── */
const T = {
  bgMenu: '#111111',
  text: '#F2EDE5',
  gold: '#9A7C50',
  hoverBg: '#1A1A18',
  sectionLabel: '#3A3A38',
  textMuted: '#888888',
  sans: Platform.select({ ios: 'System', android: 'sans-serif', default: 'Montserrat, sans-serif' }),
};

/* ─────────────────────────────────────────────
   COMPONENTE: FILA DE ENLACE INDIVIDUAL
   ───────────────────────────────────────────── */
function DrawerItem({ icon, label, isActive, onPress }) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') setHovered(true);
  };
  const handleMouseLeave = () => {
    if (Platform.OS === 'web') setHovered(false);
  };

  return (
    <Pressable
      onPress={onPress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={[
        S.item,
        isActive && S.itemActive,
        (!isActive && hovered) && S.itemHover,
      ]}
    >
      <Feather
        name={icon}
        size={18}
        color={isActive ? T.gold : hovered ? T.text : T.textMuted}
        style={S.itemIcon}
      />
      <Text style={[
        S.itemText,
        isActive ? S.itemTextActive : hovered ? S.itemTextHover : S.itemTextMuted
      ]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE: SECCIÓN CONTENEDORA
   ───────────────────────────────────────────── */
function DrawerSection({ label, children }) {
  return (
    <View style={S.sectionContainer}>
      <Text style={S.sectionLabel}>{label}</Text>
      <View style={S.sectionContent}>{children}</View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE: BOTÓN DE CERRAR "X"
   ───────────────────────────────────────────── */
function CloseButton({ onPress, isMobile }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onMouseEnter={() => Platform.OS === 'web' && setHovered(true)}
      onMouseLeave={() => Platform.OS === 'web' && setHovered(false)}
      style={[
        S.closeButton,
        hovered && { backgroundColor: 'rgba(255,255,255,0.05)' },
        isMobile ? {
          position: 'absolute',
          top: (Platform.OS === 'web' ? 24 : 24 + (Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24))) + 2,
          right: 38,
        } : {}
      ]}
    >
      <Feather name="x" size={24} color={hovered ? T.text : T.textMuted} />
    </Pressable>
  );
}



/* ─────────────────────────────────────────────
   COMPONENTE: BOTÓN DE LOGOUT (Hover Especial Rojo)
   ───────────────────────────────────────────── */
function LogoutButton({ onLogout }) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = () => {
    if (Platform.OS === 'web') setHovered(true);
  };
  const handleMouseLeave = () => {
    if (Platform.OS === 'web') setHovered(false);
  };

  return (
    <Pressable
      onPress={onLogout}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={[
        S.logoutBtn,
        hovered && S.logoutBtnHover,
      ]}
    >
      <Feather
        name="log-out"
        size={18}
        color={hovered ? '#C05050' : T.textMuted}
      />
      <Text style={[
        S.logoutBtnText,
        hovered && S.logoutBtnTextHover
      ]}>
        Cerrar sesión
      </Text>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL EXPORTABLE
   ───────────────────────────────────────────── */
export default function UserMenu({
  isOpen,
  onClose,
  user,
  vistaActual,
  dashboardTab,
  setVista,
  setDashboardTab,
  onSignOut,
  isUserPlus
}) {
  const { width } = useWindowDimensions();
  const isWide = width > 1024;
  
  // Ancho responsivo
  const drawerWidth = isWide ? 400 : width;

  // Animaciones de slide y opacidad
  const slideAnim = useRef(new Animated.Value(1)).current;
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start((result) => {
        if (result.finished) {
          setShouldRender(false);
        }
      });
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, drawerWidth],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  const obtenerIniciales = () => {
    if (!user) return 'US';
    if (user.user_metadata?.full_name) {
      const partes = user.user_metadata.full_name.split(' ');
      if (partes.length > 1) return (partes[0][0] + partes[1][0]).toUpperCase();
      return partes[0][0].toUpperCase();
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'US';
  };

  const obtenerNombreUsuario = () => {
    if (!user) return 'Usuario';
    return user.user_metadata?.full_name || user.email || 'Usuario Premium';
  };

  const obtenerRolUsuario = () => {
    if (!user) return 'Comprador';
    return user.user_metadata?.client_type || 'Comprador';
  };

  return (
    <View style={S.overlay}>
      {/* Backdrop */}
      <Animated.View style={[S.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View
        style={[
          S.drawerContainer,
          {
            width: drawerWidth,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* HEADER */}
        <View style={S.header}>
          <View style={S.profileSection}>
            <View style={{ position: 'relative' }}>
              <View style={S.avatar}>
                {user?.user_metadata?.avatar_url ? (
                  <Image source={{ uri: user.user_metadata.avatar_url }} style={S.avatarImage} />
                ) : (
                  <Text style={S.avatarText}>{obtenerIniciales()}</Text>
                )}
              </View>
              {isUserPlus && (
                <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#0C0C0C', borderRadius: 8, padding: 3, borderWidth: 1, borderColor: '#A07840', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 2 }}>
                  <FontAwesome5 name="crown" size={8} color="#A07840" />
                </View>
              )}
            </View>
            <View style={[S.userInfo, !isWide && { marginRight: 36 }]}>
              <Text style={S.userName} numberOfLines={1}>{obtenerNombreUsuario()}</Text>
              {isUserPlus ? (
                <Text style={{ color: '#A07840', fontSize: 11, fontWeight: '700', marginTop: 2, letterSpacing: 1 }}>INMOVIRAL PLUS</Text>
              ) : (
                <Text style={S.userRole} numberOfLines={1}>{user?.email || ''}</Text>
              )}
            </View>
          </View>
          <CloseButton onPress={onClose} isMobile={!isWide} />
        </View>

        {/* CONTENIDO SCROLLABLE */}
        <ScrollView
          style={S.scrollContainer}
          contentContainerStyle={S.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* MI ACTIVIDAD */}
          <DrawerSection label="Mi Actividad">
            <DrawerItem
              icon="layout"
              label="Dashboard"
              isActive={vistaActual === 'dashboard' && dashboardTab === 'dashboard'}
              onPress={() => {
                setVista('dashboard');
                setDashboardTab('dashboard');
                onClose();
              }}
            />
            <DrawerItem
              icon="edit"
              label="Mis publicaciones"
              isActive={vistaActual === 'dashboard' && dashboardTab === 'publicaciones'}
              onPress={() => {
                setVista('dashboard');
                setDashboardTab('publicaciones');
                onClose();
              }}
            />
            <DrawerItem
              icon="heart"
              label="Favoritos"
              isActive={vistaActual === 'dashboard' && dashboardTab === 'guardadas'}
              onPress={() => {
                setVista('dashboard');
                setDashboardTab('guardadas');
                onClose();
              }}
            />
            <DrawerItem
              icon="message-circle"
              label="Mensajes"
              isActive={vistaActual === 'chat'}
              onPress={() => {
                setVista('chat');
                onClose();
              }}
            />
          </DrawerSection>

          {/* EXPLORAR */}
          <DrawerSection label="Explorar">
            <DrawerItem
              icon="home"
              label="Propiedades"
              isActive={vistaActual === 'venta'}
              onPress={() => {
                setVista('venta');
                onClose();
              }}
            />
            <DrawerItem
              icon="tag"
              label="Vender"
              isActive={vistaActual === 'vendedor'}
              onPress={() => {
                setVista('vendedor');
                onClose();
              }}
            />
            <DrawerItem
              icon="zap"
              label="Servicios Virales"
              isActive={vistaActual === 'servicios'}
              onPress={() => {
                setVista('servicios');
                onClose();
              }}
            />
            <DrawerItem
              icon="users"
              label="Sobre Nosotros"
              isActive={vistaActual === 'nosotros'}
              onPress={() => {
                setVista('nosotros');
                onClose();
              }}
            />
          </DrawerSection>

          {/* CUENTA */}
          <DrawerSection label="Cuenta">
            <DrawerItem
              icon="user"
              label="Mi perfil"
              isActive={vistaActual === 'perfil'}
              onPress={() => {
                setVista('perfil');
                onClose();
              }}
            />
            <DrawerItem
              icon="settings"
              label="Configuración"
              isActive={vistaActual === 'configuracion'}
              onPress={() => {
                setVista('configuracion');
                onClose();
              }}
            />
            <DrawerItem
              icon="star"
              label="Reseñas"
              isActive={vistaActual === 'resenas'}
              onPress={() => {
                setVista('resenas');
                onClose();
              }}
            />
          </DrawerSection>
        </ScrollView>

        {/* FOOTER */}
        <View style={S.footer}>
          <LogoutButton onLogout={onSignOut} />
        </View>
      </Animated.View>
    </View>
  );
}

/* ─────────────────────────────────────────────
   ESTILOS PREMIUM LOCALES
   ───────────────────────────────────────────── */
const S = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    ...Platform.select({
      web: { position: 'fixed' },
      default: {},
    }),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContainer: {
    height: '100%',
    backgroundColor: T.bgMenu,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'web' ? 24 : 24 + (Platform.OS === 'ios' ? 47 : (StatusBar.currentHeight || 24)),
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: T.hoverBg,
    borderWidth: 1,
    borderColor: T.gold,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarText: {
    color: T.gold,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: T.sans,
  },
  userInfo: {
    justifyContent: 'center',
    flex: 1,
    marginRight: 8,
  },
  userName: {
    color: T.text,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: T.sans,
    marginBottom: 2,
  },
  userRole: {
    color: T.textMuted,
    fontSize: 10,
    fontFamily: T.sans,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: { transition: 'background-color 0.15s ease' },
      default: {},
    }),
  },

  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionContainer: {
    marginTop: 24,
  },
  sectionLabel: {
    color: T.sectionLabel,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    paddingHorizontal: 24,
    marginBottom: 8,
    fontFamily: T.sans,
  },
  sectionContent: {
    gap: 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'background-color 0.15s ease, border-left-color 0.15s ease',
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  itemActive: {
    borderLeftColor: T.gold,
    backgroundColor: T.hoverBg,
  },
  itemHover: {
    backgroundColor: T.hoverBg,
  },
  itemIcon: {
    marginRight: 14,
  },
  itemText: {
    fontFamily: T.sans,
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  itemTextMuted: {
    color: T.textMuted,
  },
  itemTextHover: {
    color: T.text,
  },
  itemTextActive: {
    color: T.gold,
    fontWeight: '500',
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: T.bgMenu,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
      },
      default: {},
    }),
  },
  logoutBtnHover: {
    backgroundColor: '#1A0A0A',
    borderColor: 'rgba(192, 80, 80, 0.25)',
  },
  logoutBtnText: {
    color: T.text,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 1,
    fontFamily: T.sans,
    ...Platform.select({
      web: { transition: 'color 0.15s ease' },
      default: {},
    }),
  },
  logoutBtnTextHover: {
    color: '#C05050',
  },
});
