import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { BRAND } from "@/lib/constants";
import { FONTS } from "@/lib/fonts";

type Props = ViewProps & {
  title?: string;
  subtitle?: string;
};

export function Card({ title, subtitle, style, children, ...rest }: Props) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.gray200,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: FONTS.bold,
    color: BRAND.gray900,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: BRAND.gray500,
    marginTop: -4,
  },
});
