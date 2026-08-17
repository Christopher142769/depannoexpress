import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { BRAND } from "@/lib/constants";
import { FONTS } from "@/lib/fonts";

type Props = TextInputProps & {
  label?: string;
  error?: string;
};

export function Input({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={BRAND.gray500}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    color: BRAND.gray900,
  },
  input: {
    borderWidth: 1,
    borderColor: BRAND.gray200,
    backgroundColor: BRAND.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: FONTS.regular,
    color: BRAND.gray900,
  },
  inputError: {
    borderColor: BRAND.red,
  },
  error: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    color: BRAND.red,
  },
});
