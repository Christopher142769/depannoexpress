import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { apiFetch, formatFCFA, resolveAssetUrl } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import type { Product } from "@/lib/types";

export default function BoutiqueScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch<{ products: Product[] }>("/api/products");
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setProducts(res.data.products);
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
      data={products}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Pièces & accessoires</Text>
          <Text style={styles.subtitle}>Catalogue — commande bientôt disponible dans l&apos;app</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      }
      renderItem={({ item }) => {
        const imageUri = resolveAssetUrl(item.imageUrl);
        return (
          <Card style={styles.card}>
            <View style={styles.row}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]} />
              )}
              <View style={styles.meta}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.desc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.price}>{formatFCFA(item.price)}</Text>
                <Text style={styles.stock}>Stock : {item.stock}</Text>
              </View>
            </View>
          </Card>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.empty}>Aucun produit pour le moment.</Text>
      }
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  header: { gap: 4, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: BRAND.gray900 },
  subtitle: { fontSize: 14, color: BRAND.gray500, marginBottom: 8 },
  card: { marginBottom: 4 },
  row: { flexDirection: "row", gap: 12 },
  image: { width: 88, height: 88, borderRadius: 12, backgroundColor: BRAND.gray200 },
  imagePlaceholder: { backgroundColor: BRAND.gray200 },
  meta: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontWeight: "700", color: BRAND.gray900 },
  desc: { fontSize: 13, color: BRAND.gray500 },
  price: { fontSize: 15, fontWeight: "700", color: BRAND.blue },
  stock: { fontSize: 12, color: BRAND.gray500 },
  error: { color: BRAND.red },
  empty: { textAlign: "center", color: BRAND.gray500, marginTop: 24 },
});
