import MapView, { Marker, type Region } from "react-native-maps";
import { StyleSheet, View } from "react-native";
import type { GeoPoint } from "@/lib/types";
import { BRAND } from "@/lib/constants";

type Props = {
  client?: GeoPoint | null;
  pro?: GeoPoint | null;
  height?: number;
};

const COTONOU: Region = {
  latitude: 6.3703,
  longitude: 2.3912,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export function InterventionMap({ client, pro, height = 220 }: Props) {
  const center = client ?? pro ?? { lat: COTONOU.latitude, lng: COTONOU.longitude };

  const region: Region = {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: client && pro ? 0.04 : 0.06,
    longitudeDelta: client && pro ? 0.04 : 0.06,
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={region} region={region}>
        {client ? (
          <Marker
            coordinate={{ latitude: client.lat, longitude: client.lng }}
            title="Votre position"
            pinColor={BRAND.blue}
          />
        ) : null}
        {pro ? (
          <Marker
            coordinate={{ latitude: pro.lat, longitude: pro.lng }}
            title="Dépanneur"
            pinColor={BRAND.red}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.gray200,
  },
});
