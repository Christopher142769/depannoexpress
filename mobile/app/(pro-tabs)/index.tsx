import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Location from "expo-location";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InterventionMap } from "@/components/InterventionMap";
import { apiFetch, formatFCFA } from "@/lib/api";
import { BRAND, STATUS_LABEL } from "@/lib/constants";
import type { Intervention } from "@/lib/types";

type MissionsData = {
  missions: Intervention[];
  active: Intervention | null;
  available: boolean;
  location: { lat: number; lng: number } | null;
};

export default function MissionsScreen() {
  const [data, setData] = useState<MissionsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<MissionsData>("/api/pro/missions");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setData(res.data);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 10000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggleAvailability = async () => {
    setToggling(true);
    setError(null);

    let lat: number | undefined;
    let lng: number | undefined;

    if (!data?.available) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setToggling(false);
        setError("Localisation requise pour devenir disponible.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    }

    const res = await apiFetch<{ isAvailable: boolean }>("/api/pro/availability", {
      method: "PATCH",
      body: JSON.stringify({
        isAvailable: !data?.available,
        ...(lat !== undefined ? { lat, lng } : {}),
      }),
    });
    setToggling(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    await load();
  };

  const accept = async (id: string) => {
    setAccepting(id);
    setError(null);
    const res = await apiFetch<{ intervention: Intervention }>(`/api/pro/missions/${id}/accept`, {
      method: "POST",
    });
    setAccepting(null);

    if (!res.ok) {
      Alert.alert("Erreur", res.error);
      return;
    }
    await load();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Availability toggle */}
      <Card>
        <View style={styles.availRow}>
          <View style={styles.availInfo}>
            <View style={[styles.dot, data?.available ? styles.dotOn : styles.dotOff]} />
            <Text style={styles.availText}>
              {data?.available ? "Disponible" : "Hors ligne"}
            </Text>
          </View>
          <Button
            title={data?.available ? "Passer hors ligne" : "Devenir disponible"}
            variant={data?.available ? "secondary" : "primary"}
            onPress={toggleAvailability}
            loading={toggling}
          />
        </View>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Active mission */}
      {data?.active ? (
        <Card title="Mission active" subtitle={STATUS_LABEL[data.active.status] ?? data.active.status}>
          <Text style={styles.problem}>{data.active.problem}</Text>
          {data.active.client ? (
            <Text style={styles.muted}>
              Client : {data.active.client.name}
              {data.active.client.phone ? ` · ${data.active.client.phone}` : ""}
            </Text>
          ) : null}
          <InterventionMap client={data.active.clientLocation} pro={data.active.proLocation} height={200} />
        </Card>
      ) : null}

      {/* Pending missions list */}
      {data?.missions && data.missions.length > 0 ? (
        <Card title={`Missions à proximité (${data.missions.length})`}>
          {data.missions.map((m) => (
            <View key={m.id} style={styles.missionRow}>
              <View style={styles.missionInfo}>
                <Text style={styles.missionProblem} numberOfLines={2}>
                  {m.problem}
                </Text>
                {m.estimatedPrice ? (
                  <Text style={styles.muted}>~{formatFCFA(m.estimatedPrice)}</Text>
                ) : null}
              </View>
              <Button
                title="Accepter"
                onPress={() => accept(m.id)}
                loading={accepting === m.id}
              />
            </View>
          ))}
        </Card>
      ) : data && !data.active ? (
        <Card>
          <Text style={styles.empty}>
            {data.available
              ? "Aucune mission à proximité pour le moment."
              : "Passez en ligne pour voir les missions."}
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  availRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  availInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  dotOn: { backgroundColor: "#22c55e" },
  dotOff: { backgroundColor: BRAND.gray500 },
  availText: { fontSize: 16, fontWeight: "600", color: BRAND.gray900 },
  error: { color: BRAND.red, fontSize: 14, paddingHorizontal: 4 },
  problem: { fontSize: 15, color: BRAND.gray900, lineHeight: 22 },
  muted: { fontSize: 14, color: BRAND.gray500 },
  missionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BRAND.gray200,
    paddingTop: 12,
  },
  missionInfo: { flex: 1, gap: 2 },
  missionProblem: { fontSize: 15, fontWeight: "600", color: BRAND.gray900 },
  empty: { textAlign: "center", color: BRAND.gray500, paddingVertical: 8 },
});
