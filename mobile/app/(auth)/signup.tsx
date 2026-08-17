import { useState } from "react";
import { Link, router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { BRAND, type UserRole } from "@/lib/constants";
import { FONTS } from "@/lib/fonts";
import type { AuthUser } from "@/lib/types";
import { useAuthStore } from "@/stores/auth-store";

export default function SignupScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("client");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isPro = role === "pro";

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim().toLowerCase();
    if (name.trim().length < 2) {
      setError("Nom requis (2 caractères minimum)");
      return;
    }
    if (!trimmedEmail.includes("@")) {
      setError("Adresse email invalide");
      return;
    }
    if (password.length < 6) {
      setError("Mot de passe trop court (min. 6 caractères)");
      return;
    }

    setLoading(true);
    const res = await apiFetch<{ user: AuthUser; token: string }>("/api/auth/signup", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        email: trimmedEmail,
        password,
        role,
        name: name.trim(),
        phone: phone.trim() || undefined,
      }),
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
          title={isPro ? "Inscription dépanneur" : "Inscription utilisateur"}
          subtitle="Créez votre compte"
        >
          <Input label="Nom complet" value={name} onChangeText={setName} autoComplete="name" />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="Téléphone (optionnel)"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password-new"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Créer mon compte" onPress={submit} loading={loading} />
        </Card>

        <Text style={styles.footer}>
          Déjà inscrit ?{" "}
          <Link href="/(auth)/login" style={styles.link}>
            Se connecter
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
    gap: 16,
    backgroundColor: BRAND.gray100,
  },
  roleRow: { flexDirection: "row", gap: 10 },
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
  error: { color: BRAND.red, fontSize: 14 },
  footer: { textAlign: "center", fontFamily: FONTS.regular, color: BRAND.gray500 },
  link: { color: BRAND.blue, fontFamily: FONTS.semibold },
});
