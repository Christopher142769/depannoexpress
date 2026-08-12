import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { apiFetch, formatFCFA } from "@/lib/api";
import { BRAND } from "@/lib/constants";

type Transaction = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
};

type WalletData = {
  balance: number;
  transactions: Transaction[];
};

export default function WalletScreen() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<WalletData>("/api/wallet");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setData(res.data);
    setError(null);
  }, []);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BRAND.blue} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      data={data?.transactions ?? []}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.balanceLabel}>Solde</Text>
          <Text style={styles.balance}>{formatFCFA(data?.balance ?? 0)}</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      renderItem={({ item }) => {
        const isPositive = item.amount > 0;
        return (
          <Card style={styles.txCard}>
            <View style={styles.txRow}>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{item.description}</Text>
                <Text style={styles.muted}>
                  {new Date(item.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </View>
              <Text style={[styles.txAmount, isPositive ? styles.txPositive : styles.txNegative]}>
                {isPositive ? "+" : ""}
                {formatFCFA(item.amount)}
              </Text>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucune transaction pour le moment.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { alignItems: "center", paddingVertical: 16, gap: 4, marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: BRAND.gray500, textTransform: "uppercase", letterSpacing: 1 },
  balance: { fontSize: 36, fontWeight: "800", color: BRAND.gray900 },
  txCard: { marginBottom: 4 },
  txRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { fontSize: 14, fontWeight: "600", color: BRAND.gray900 },
  muted: { fontSize: 12, color: BRAND.gray500 },
  txAmount: { fontSize: 16, fontWeight: "700" },
  txPositive: { color: "#16a34a" },
  txNegative: { color: BRAND.red },
  error: { color: BRAND.red },
  empty: { textAlign: "center", color: BRAND.gray500, marginTop: 24 },
});
