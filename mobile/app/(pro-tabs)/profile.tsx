import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BRAND } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

export default function ProProfileScreen() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

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
    <ScrollView contentContainerStyle={styles.container}>
      <Card>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.muted}>{user?.email}</Text>
        <Text style={styles.role}>Dépanneur</Text>
      </Card>

      <Card title="À propos">
        <Text style={styles.muted}>
          Version 1.0.0 · Dépannage Express
        </Text>
      </Card>

      <Button title="Déconnexion" variant="secondary" onPress={confirmLogout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16, paddingBottom: 32 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.red,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  avatarText: { fontSize: 32, fontWeight: "800", color: BRAND.white },
  name: { fontSize: 20, fontWeight: "700", color: BRAND.gray900, textAlign: "center" },
  muted: { fontSize: 14, color: BRAND.gray500, textAlign: "center" },
  role: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.red,
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
