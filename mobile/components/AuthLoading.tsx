import { ActivityIndicator, StyleSheet, View } from "react-native";
import { BRAND } from "@/lib/constants";

export function AuthLoading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={BRAND.blue} />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.gray100,
  },
});
