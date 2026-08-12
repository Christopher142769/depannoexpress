import { Redirect } from "expo-router";
import { AuthLoading } from "@/components/AuthLoading";
import { useAuthStore } from "@/stores/auth-store";

export default function Index() {
  const { user, isReady } = useAuthStore();

  if (!isReady) return <AuthLoading />;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.role === "pro") return <Redirect href="/(pro-tabs)" />;
  return <Redirect href="/(tabs)" />;
}
