import { useState } from "react";
import { Link, router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api";
import { BRAND, type UserRole } from "@/lib/constants";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
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
      setError("Adresse e-mail invalide");
      return;
    }

    setLoading(true);
    const res = await apiFetch<{ ok: boolean }>("/api/auth/request-otp", {
      method: "POST",
      auth: false,
      body: JSON.stringify({
        mode: "signup",
        email: trimmedEmail,
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

    router.push({ pathname: "/(auth)/otp", params: { email: trimmedEmail } });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
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
          title={isPro ? "Inscription dépanneur" : "Inscription conducteur"}
          subtitle="Vérification par e-mail"
        >
          <Input label="Nom complet" value={name} onChangeText={setName} autoComplete="name" />
          <Input
            label="E-mail"
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
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Continuer" onPress={submit} loading={loading} />
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
  roleTxt: { fontSize: 15, fontWeight: "600", color: BRAND.gray500 },
  roleTxtActive: { color: BRAND.white },
  roleTxtActivePro: { color: BRAND.white },
  error: { color: BRAND.red, fontSize: 14 },
  footer: { textAlign: "center", color: BRAND.gray500 },
  link: { color: BRAND.blue, fontWeight: "600" },
});
