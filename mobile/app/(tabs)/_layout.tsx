import { Redirect, Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { BRAND } from "@/lib/constants";
import { useAuthStore } from "@/stores/auth-store";

export default function TabLayout() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Redirect href="/(auth)/login" />;
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BRAND.blue,
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
          title: "Accueil",
          headerTitle: "Dépannage Express",
          tabBarIcon: ({ color }) => (
            <SymbolView name={{ ios: "wrench.fill", android: "build", web: "build" }} tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="boutique"
        options={{
          title: "Boutique",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: "bag.fill", android: "shopping_bag", web: "shopping_bag" }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
