import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { BRAND } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

export default function ProTabLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user || user.role !== "pro") return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND.red,
        tabBarInactiveTintColor: BRAND.gray500,
        headerStyle: { backgroundColor: BRAND.white },
        headerTitleStyle: { fontWeight: "700" },
        tabBarStyle: {
          backgroundColor: BRAND.white,
          borderTopColor: BRAND.gray200,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Missions",
          headerTitle: "Missions disponibles",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "list.bullet", android: "list", web: "list" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="active"
        options={{
          title: "En cours",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "location.fill", android: "near_me", web: "near_me" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Portefeuille",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "creditcard.fill", android: "account_balance_wallet", web: "account_balance_wallet" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "person.fill", android: "person", web: "person" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
