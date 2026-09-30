import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

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

function PropertyRow({ property, onSelectProperty, isLocked }) {
  return (
    <Pressable
      onPress={() => onSelectProperty && onSelectProperty(property.id)}
      style={s.row}
    >
      <Image
        source={{ uri: property.imagenes?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }}
        style={s.thumb}
      />
      <View style={s.rowBody}>
        <Text style={s.title} numberOfLines={1}>{property.titulo || 'Propiedad'}</Text>
        <Text style={s.meta} numberOfLines={1}>{property.ubicacion || 'Ubicación no disponible'}</Text>
        <Text style={s.price}>${Number(property.price || property.precio || 0).toLocaleString()} MXN</Text>
      </View>
      <Feather name={isLocked ? 'lock' : 'chevron-right'} size={18} color={T.gold} />
    </Pressable>
  );
}

export default function InteractiveMap({ propiedades = [], onSelectProperty, user, onRequireLogin }) {
  const sortedProperties = Array.isArray(propiedades) ? propiedades.slice(0, 12) : [];

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
      <View style={s.header}>
        <Feather name="map" size={18} color={T.gold} />
        <Text style={s.headerTitle}>MAPA EXCLUSIVO PARA ANDROID</Text>
      </View>
      <Text style={s.headerDesc}>
        Para evitar cierres en Android, esta vista usa una lista segura de propiedades. Toca una propiedad para abrir sus detalles.
      </Text>
      <ScrollView contentContainerStyle={s.list} showsVerticalScrollIndicator={false}>
        {sortedProperties.length > 0 ? (
          sortedProperties.map(property => (
            <PropertyRow
              key={property.id}
              property={property}
              onSelectProperty={onSelectProperty}
              isLocked={!user}
            />
          ))
        ) : (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No hay propiedades disponibles para mostrar.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    minHeight: 360,
    borderRadius: 20,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.18)',
    overflow: 'hidden',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  headerTitle: {
    color: T.white,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '700',
  },
  headerDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  list: {
    gap: 12,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#131313',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: T.white,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  meta: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 12,
    marginBottom: 4,
  },
  price: {
    color: T.gold,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  lockedMapContainer: {
    minHeight: 320,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.18)',
  },
  lockedMapTitle: {
    color: T.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  lockedMapText: {
    color: 'rgba(255,255,255,0.68)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
    maxWidth: 360,
  },
  lockedMapBtn: {
    borderWidth: 1,
    borderColor: 'rgba(160,120,64,0.6)',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
  },
  lockedMapBtnText: {
    color: T.gold,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
});