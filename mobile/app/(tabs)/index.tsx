import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/Input";
import { InterventionMap } from "@/components/InterventionMap";
import { apiFetch, formatFCFA } from "@/lib/api";
import { ACTIVE_STATUSES, BRAND, STATUS_LABEL } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";
import type { Intervention } from "@/lib/types";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [problem, setProblem] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = useMemo(
    () => interventions.filter((i) => ACTIVE_STATUSES.includes(i.status as (typeof ACTIVE_STATUSES)[number])),
    [interventions]
  );
  const selected = active[0] ?? null;

  const load = useCallback(async () => {
    const res = await apiFetch<{ interventions: Intervention[] }>("/api/interventions");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setInterventions(res.data.interventions);
    setError(null);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 12000);
    return () => clearInterval(t);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const locate = async () => {
    setGeoLoading(true);
    setError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setGeoLoading(false);
      setError("Autorisez la localisation pour signaler une panne.");
      return;
    }
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    setGeoLoading(false);
  };

  const submit = async () => {
    setMessage(null);
    setError(null);
    if (problem.trim().length < 5) {
      setError("Décrivez la panne (5 caractères minimum).");
      return;
    }
    if (!coords) {
      setError("Activez votre position avant d'envoyer.");
      return;
    }

    setSubmitLoading(true);
    const res = await apiFetch<{ intervention: Intervention }>("/api/interventions", {
      method: "POST",
      body: JSON.stringify({
        problem: problem.trim(),
        lat: coords.lat,
        lng: coords.lng,
      }),
    });
    setSubmitLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setProblem("");
    setMessage("Demande envoyée. Un dépanneur va être alerté.");
    await load();
  };

  const confirmLogout = () => {
    Alert.alert("Déconnexion", "Voulez-vous vous déconnecter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Card>
        <Text style={styles.greeting}>Bonjour {user?.name?.split(" ")[0] ?? ""}</Text>
        <Text style={styles.muted}>{user?.email}</Text>
        <Button title="Déconnexion" variant="ghost" onPress={confirmLogout} />
      </Card>

      {selected ? (
        <Card title="Intervention en cours" subtitle={STATUS_LABEL[selected.status] ?? selected.status}>
          <Text style={styles.problem}>{selected.problem}</Text>
          {selected.pro?.name ? (
            <Text style={styles.muted}>
              Dépanneur : {selected.pro.name}
              {selected.pro.phone ? ` · ${selected.pro.phone}` : ""}
            </Text>
          ) : (
            <Text style={styles.muted}>En attente d&apos;un dépanneur…</Text>
          )}
          {selected.estimatedPrice ? (
            <Text style={styles.price}>Estimation : {formatFCFA(selected.estimatedPrice)}</Text>
          ) : null}
          <InterventionMap client={selected.clientLocation} pro={selected.proLocation} height={240} />
        </Card>
      ) : (
        <Card title="Signaler une panne" subtitle="Décrivez le problème et partagez votre position">
          <Input
            label="Description"
            value={problem}
            onChangeText={setProblem}
            placeholder="Ex. batterie à plat, crevaison…"
            multiline
            numberOfLines={3}
            style={styles.textarea}
          />
          <Button
            title={coords ? "Position enregistrée" : "Utiliser ma position"}
            variant="secondary"
            onPress={locate}
            loading={geoLoading}
          />
          {coords ? (
            <Text style={styles.coords}>
              GPS : {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {message ? <Text style={styles.success}>{message}</Text> : null}
          <Button title="Envoyer la demande" onPress={submit} loading={submitLoading} />
        </Card>
      )}

      {interventions.length > 0 ? (
        <Card title="Historique récent">
          {interventions.slice(0, 5).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <Text style={styles.historyTitle}>{STATUS_LABEL[item.status] ?? item.status}</Text>
              <Text style={styles.muted} numberOfLines={1}>
                {item.problem}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  greeting: {
    fontSize: 20,
    fontWeight: "700",
    color: BRAND.gray900,
  },
  muted: {
    fontSize: 14,
    color: BRAND.gray500,
  },
  problem: {
    fontSize: 15,
    color: BRAND.gray900,
    lineHeight: 22,
  },
  price: {
    fontWeight: "600",
    color: BRAND.blue,
  },
  textarea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  coords: {
    fontSize: 12,
    color: BRAND.gray500,
    fontFamily: "monospace",
  },
  error: { color: BRAND.red, fontSize: 14 },
  success: { color: BRAND.blueDark, fontSize: 14 },
  historyRow: {
    borderTopWidth: 1,
    borderTopColor: BRAND.gray200,
    paddingTop: 10,
    gap: 2,
  },
  historyTitle: {
    fontWeight: "600",
    color: BRAND.gray900,
  },
});
