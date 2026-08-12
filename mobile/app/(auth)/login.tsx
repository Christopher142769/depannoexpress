import { useState } from "react";
import { Link, router } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { APP_NAME, BRAND } from "@/lib/constants";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      body: JSON.stringify({ mode: "login", email: trimmed, role: "client" }),
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

        <Card title="Connexion conducteur" subtitle="Code envoyé par e-mail uniquement">
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
  footer: { textAlign: "center", color: BRAND.gray500 },
  link: { color: BRAND.blue, fontWeight: "600" },
});
