import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";
import { BRAND } from "@/lib/constants";

type Props = PressableProps & {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  title,
  loading,
  variant = "primary",
  disabled,
  style,
  ...rest
}: Props) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => {
        const base = [
          styles.base,
          isPrimary && styles.primary,
          variant === "secondary" && styles.secondary,
          isGhost && styles.ghost,
          (disabled || loading) && styles.disabled,
          state.pressed && !disabled && !loading && styles.pressed,
        ];
        if (!style) return base;
        return [...base, typeof style === "function" ? style(state) : style];
      }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? BRAND.white : BRAND.blue} />
      ) : (
        <Text
          style={[
            styles.label,
            isPrimary && styles.labelPrimary,
            variant === "secondary" && styles.labelSecondary,
            isGhost && styles.labelGhost,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primary: {
    backgroundColor: BRAND.blue,
  },
  secondary: {
    backgroundColor: BRAND.gray100,
    borderWidth: 1,
    borderColor: BRAND.gray200,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  labelPrimary: {
    color: BRAND.white,
  },
  labelSecondary: {
    color: BRAND.gray900,
  },
  labelGhost: {
    color: BRAND.blue,
  },
});
