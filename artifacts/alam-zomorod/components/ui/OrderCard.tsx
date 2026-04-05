import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { ServiceRequest as Order } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { Badge } from "./Badge";

interface OrderCardProps {
  order: Order;
  onPress?: () => void;
  onRate?: () => void;
}

function getStatusBadge(status: Order["status"]): {
  label: string;
  variant: "default" | "success" | "warning" | "error" | "accent" | "outline";
} {
  switch (status) {
    case "pending":
      return { label: STRINGS.orders.pending, variant: "warning" };
    case "offers_received":
      return { label: "عروض مستلمة", variant: "accent" };
    case "accepted":
      return { label: STRINGS.orders.accepted, variant: "default" };
    case "in_progress":
      return { label: STRINGS.orders.inProgress, variant: "default" };
    case "completed":
      return { label: STRINGS.orders.done, variant: "success" };
    case "cancelled":
      return { label: STRINGS.orders.cancelled, variant: "error" };
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ar-SA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function OrderCard({ order, onPress, onRate }: OrderCardProps) {
  const colors = useColors();
  const badge = getStatusBadge(order.status);
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
      <View style={styles.header}>
        <View>
          <Text style={[styles.serviceName, { color: colors.foreground }]}>
            {order.serviceName}
          </Text>
          <Text style={[styles.category, { color: colors.mutedForeground }]}>
            {order.categoryName}
          </Text>
        </View>
        <Badge label={badge.label} variant={badge.variant} />
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {" "}{formatDate(order.scheduledAt)}
          </Text>
        </View>
        {order.providerName && (
          <View style={styles.detailRow}>
            <Feather name="user" size={14} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
              {" "}{order.providerName}
            </Text>
          </View>
        )}
        {order.price && (
          <View style={styles.detailRow}>
            <Feather name="dollar-sign" size={14} color={colors.primary} />
            <Text style={[styles.priceText, { color: colors.primary }]}>
              {" "}{order.price} {STRINGS.common.sar}
            </Text>
          </View>
        )}
      </View>

      {order.status === "completed" && !order.rating && onRate && (
        <TouchableOpacity
          style={[styles.rateBtn, { backgroundColor: colors.accent + "20" }]}
          onPress={onRate}
        >
          <Feather name="star" size={14} color={colors.accent} />
          <Text style={[styles.rateBtnText, { color: colors.accent }]}>
            {" "}{STRINGS.orders.rateNow}
          </Text>
        </TouchableOpacity>
      )}

      {order.rating && (
        <View style={styles.ratingRow}>
          <Feather name="star" size={14} color={colors.accent} />
          <Text style={[styles.ratingText, { color: colors.accent }]}>
            {" "}تقييمك: {order.rating}/5
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  category: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  details: {
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  priceText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  rateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  rateBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  ratingText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
