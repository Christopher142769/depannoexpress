import { Stack } from "expo-router";
import { BRAND } from "@/lib/constants";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: BRAND.white },
        headerTintColor: BRAND.blue,
        headerTitleStyle: { fontWeight: "700" },
        contentStyle: { backgroundColor: BRAND.gray100 },
      }}
    >
      <Stack.Screen name="login" options={{ title: "Connexion" }} />
      <Stack.Screen name="otp" options={{ title: "Vérification" }} />
      <Stack.Screen name="signup" options={{ title: "Inscription" }} />
    </Stack>
  );
}
