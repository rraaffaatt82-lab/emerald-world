import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Service } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";

interface ServiceCardProps {
  service: Service;
  categoryColor?: string;
  onPress?: () => void;
  onOrder?: () => void;
}

export function ServiceCard({ service, categoryColor, onPress, onOrder }: ServiceCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.icon, { backgroundColor: (categoryColor || colors.primary) + "20" }]}>
        <Feather name="scissors" size={22} color={categoryColor || colors.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.foreground }]}>{service.name}</Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={1}>
          {service.description}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {service.basePrice} {STRINGS.common.sar}
          </Text>
          <Text style={[styles.duration, { color: colors.mutedForeground }]}>
            {service.duration} دقيقة
          </Text>
        </View>
      </View>
      {onOrder && (
        <TouchableOpacity
          style={[styles.orderBtn, { backgroundColor: colors.primary }]}
          onPress={onOrder}
        >
          <Feather name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 12,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 2,
  },
  price: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  duration: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  orderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginStart: 8,
  },
});
