import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { useColors } from "@/hooks/useColors";
import colors from "@/constants/colors";

type BadgeVariant = "default" | "success" | "warning" | "error" | "accent" | "outline";

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  color?: string;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: colors.light.secondary, text: colors.light.primary },
  success: { bg: "#e8f5e9", text: "#2e7d32" },
  warning: { bg: "#fff8e1", text: "#f57f17" },
  error: { bg: "#ffebee", text: "#c62828" },
  accent: { bg: "#fdf6e3", text: colors.light.accent },
  outline: { bg: "transparent", text: colors.light.primary },
};

export function Badge({ label, variant = "default", style, color }: BadgeProps) {
  const v = VARIANT_COLORS[variant];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: color ?? v.bg },
        variant === "outline" && {
          borderWidth: 1,
          borderColor: colors.light.primary,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { color: v.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
