import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function PropertyMap({ lat, lng, titulo }) {
  const latitude = parseFloat(lat || 24.0277);
  const longitude = parseFloat(lng || -104.6538);

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        scrollEnabled={true}
        zoomEnabled={true}
      >
        <Marker
          coordinate={{ latitude, longitude }}
          title={titulo}
        />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});
