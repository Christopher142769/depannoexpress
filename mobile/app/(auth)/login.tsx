import { useState } from "react";
import { Link, router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { APP_NAME, BRAND, type UserRole } from "@/lib/constants";
import { FONTS } from "@/lib/fonts";
import type { AuthUser } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = role === "pro";

  const submit = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Adresse email invalide");
      return;
    }
    if (!password) {
      setError("Mot de passe requis");
      return;
    }

    setLoading(true);
    const res = await apiFetch<{ user: AuthUser; token: string }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email: trimmed, password, role }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    await setSession(res.data.user, res.data.token);
    router.replace(res.data.user.role === "pro" ? "/(pro-tabs)" : "/(tabs)");
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Text style={styles.brand}>{APP_NAME}</Text>
          <Text style={styles.tagline}>Assistance routière au Bénin</Text>
        </View>

        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleBtn, !isPro && styles.roleBtnActive]}
            onPress={() => setRole("client")}
          >
            <Text style={[styles.roleTxt, !isPro && styles.roleTxtActive]}>Utilisateur</Text>
          </Pressable>
          <Pressable
            style={[styles.roleBtn, isPro && styles.roleBtnActivePro]}
            onPress={() => setRole("pro")}
          >
            <Text style={[styles.roleTxt, isPro && styles.roleTxtActivePro]}>Dépanneur</Text>
          </Pressable>
        </View>

        <Card
          title={isPro ? "Connexion dépanneur" : "Connexion utilisateur"}
          subtitle="Email et mot de passe"
        >
          <Input
            label="Adresse email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.bj"
          />
          <Input
            label="Mot de passe"
            secureTextEntry
            autoComplete="password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            error={error ?? undefined}
          />
          <Button title="Se connecter" onPress={submit} loading={loading} />
        </Card>

        <Text style={styles.footer}>
          Pas encore de compte ?{" "}
          <Link href="/(auth)/signup" style={styles.link}>
            S&apos;inscrire
          </Link>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 20,
    backgroundColor: BRAND.gray100,
  },
  hero: { alignItems: "center", paddingVertical: 12, gap: 4 },
  brand: { fontSize: 26, fontFamily: FONTS.extrabold, color: BRAND.blue },
  tagline: { fontSize: 14, fontFamily: FONTS.regular, color: BRAND.gray500 },
  roleRow: {
    flexDirection: "row",
    gap: 10,
  },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: BRAND.gray200,
  },
  roleBtnActive: { backgroundColor: BRAND.blue },
  roleBtnActivePro: { backgroundColor: BRAND.red },
  roleTxt: { fontSize: 15, fontFamily: FONTS.semibold, color: BRAND.gray500 },
  roleTxtActive: { color: BRAND.white },
  roleTxtActivePro: { color: BRAND.white },
  footer: { textAlign: "center", fontFamily: FONTS.regular, color: BRAND.gray500 },
  link: { color: BRAND.blue, fontFamily: FONTS.semibold },
});
