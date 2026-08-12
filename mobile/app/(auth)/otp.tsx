import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { BRAND } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthUser } from "@/lib/types";

export default function OtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const setSession = useAuthStore((s) => s.setSession);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async () => {
    if (!email) {
      setError("E-mail manquant");
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      setError("Le code doit contenir 6 chiffres");
      return;
    }

    setError(null);
    setLoading(true);
    const res = await apiFetch<{ user: AuthUser; token: string }>("/api/auth/verify-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ email, code }),
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    await setSession(res.data.user, res.data.token);
    router.replace("/(tabs)");
  };

  const resend = async () => {
    if (!email) return;
    setResending(true);
    const res = await apiFetch("/api/auth/request-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({ mode: "login", email, role: "client" }),
    });
    setResending(false);
    setError(res.ok ? null : res.error);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card
          title="Code de vérification"
          subtitle={`Envoyé à ${email ?? "votre e-mail"}. Consultez votre boîte mail.`}
        >
          <Input
            label="Code à 6 chiffres"
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            error={error ?? undefined}
          />
          <Button title="Valider" onPress={verify} loading={loading} />
          <Button
            title="Renvoyer le code"
            variant="ghost"
            onPress={resend}
            loading={resending}
          />
        </Card>
        <Text style={styles.hint}>
          En développement, le code s&apos;affiche dans le terminal du serveur Next.js
          (EMAIL_PROVIDER=console).
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
    gap: 16,
    backgroundColor: BRAND.gray100,
  },
  hint: {
    fontSize: 13,
    color: BRAND.gray500,
    textAlign: "center",
    lineHeight: 18,
  },
});
