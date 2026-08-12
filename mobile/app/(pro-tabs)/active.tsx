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

export default function ActiveMissionScreen() {
  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingLocation, setSendingLocation] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch<{ active: Intervention | null }>("/api/pro/missions");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setIntervention((res.data as { active: Intervention | null }).active);
    setError(null);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
    const t = setInterval(() => void load(), 8000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const changeStatus = async (status: string) => {
    if (!intervention) return;
    setUpdating(true);
    setError(null);

    const body: Record<string, unknown> = { status };
    if (status === "completed") {
      body.finalPrice = intervention.estimatedPrice ?? 5000;
    }

    const res = await apiFetch(`/api/interventions/${intervention.id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setUpdating(false);

    if (!res.ok) {
      Alert.alert("Erreur", (res as { error: string }).error);
      return;
    }
    await load();
  };

  const sendLocation = async () => {
    if (!intervention) return;
    setSendingLocation(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setSendingLocation(false);
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await apiFetch(`/api/interventions/${intervention.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        proLat: pos.coords.latitude,
        proLng: pos.coords.longitude,
      }),
    });
    setSendingLocation(false);
    await load();
  };

  const nextStatus: Record<string, { label: string; status: string }> = {
    accepted: { label: "En route", status: "en_route" },
    en_route: { label: "Début intervention", status: "in_progress" },
    in_progress: { label: "Terminer", status: "completed" },
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chargement…</Text>
      </View>
    );
  }

  if (!intervention) {
    return (
      <ScrollView
        contentContainerStyle={styles.center}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.empty}>Aucune mission active.</Text>
        <Text style={styles.muted}>Acceptez une mission dans l'onglet Missions.</Text>
      </ScrollView>
    );
  }

  const next = nextStatus[intervention.status];

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card
        title={STATUS_LABEL[intervention.status] ?? intervention.status}
        subtitle={`Mission #${intervention.id.slice(-6)}`}
      >
        <Text style={styles.problem}>{intervention.problem}</Text>

        {intervention.estimatedPrice ? (
          <Text style={styles.price}>Estimation : {formatFCFA(intervention.estimatedPrice)}</Text>
        ) : null}

        <InterventionMap
          client={intervention.clientLocation}
          pro={intervention.proLocation}
          height={260}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title="Envoyer ma position"
          variant="secondary"
          onPress={sendLocation}
          loading={sendingLocation}
        />

        {next ? (
          <Button
            title={next.label}
            onPress={() => changeStatus(next.status)}
            loading={updating}
          />
        ) : null}

        {["accepted", "en_route"].includes(intervention.status) ? (
          <Button
            title="Annuler la mission"
            variant="ghost"
            onPress={() => {
              Alert.alert("Annuler", "Voulez-vous vraiment annuler cette mission ?", [
                { text: "Non", style: "cancel" },
                {
                  text: "Oui, annuler",
                  style: "destructive",
                  onPress: () => void changeStatus("cancelled"),
                },
              ]);
            }}
          />
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  problem: { fontSize: 15, color: BRAND.gray900, lineHeight: 22 },
  price: { fontWeight: "600", color: BRAND.blue },
  muted: { fontSize: 14, color: BRAND.gray500, textAlign: "center" },
  error: { color: BRAND.red, fontSize: 14 },
  empty: { fontSize: 18, fontWeight: "700", color: BRAND.gray900 },
});
