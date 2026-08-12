import { useState } from "react";
import { Link, router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { APP_NAME, BRAND, type UserRole } from "@/lib/constants";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = role === "pro";

  const submit = async () => {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@")) {
      setError("Adresse e-mail invalide");
      return;
    }

    setLoading(true);
    const res = await apiFetch<{ ok: boolean }>("/api/auth/request-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ mode: "login", email: trimmed, role }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    router.push({ pathname: "/(auth)/otp", params: { email: trimmed } });
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

        {/* Role selector */}
        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleBtn, !isPro && styles.roleBtnActive]}
            onPress={() => setRole("client")}
          >
            <Text style={[styles.roleTxt, !isPro && styles.roleTxtActive]}>Conducteur</Text>
          </Pressable>
          <Pressable
            style={[styles.roleBtn, isPro && styles.roleBtnActivePro]}
            onPress={() => setRole("pro")}
          >
            <Text style={[styles.roleTxt, isPro && styles.roleTxtActivePro]}>Dépanneur</Text>
          </Pressable>
        </View>

        <Card
          title={isPro ? "Connexion dépanneur" : "Connexion conducteur"}
          subtitle="Code envoyé par e-mail uniquement"
        >
          <Input
            label="Adresse e-mail"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.bj"
            error={error ?? undefined}
          />
          <Button title="Recevoir le code" onPress={submit} loading={loading} />
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
  brand: { fontSize: 26, fontWeight: "800", color: BRAND.blue },
  tagline: { fontSize: 14, color: BRAND.gray500 },
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
  roleTxt: { fontSize: 15, fontWeight: "600", color: BRAND.gray500 },
  roleTxtActive: { color: BRAND.white },
  roleTxtActivePro: { color: BRAND.white },
  footer: { textAlign: "center", color: BRAND.gray500 },
  link: { color: BRAND.blue, fontWeight: "600" },
});
