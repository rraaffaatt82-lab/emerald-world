import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";

const STATUS_STEPS = [
  { key: "pending", label: "تم الإرسال" },
  { key: "offers_received", label: "عروض مستلمة" },
  { key: "accepted", label: "تم القبول" },
  { key: "in_progress", label: "جارٍ التنفيذ" },
  { key: "completed", label: "مكتمل" },
];

function getStatusIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, updateRequest } = useData();
  const order = requests.find((o) => o.id === id);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backBtnAlt, { paddingTop: insets.top + 10 }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.foreground }]}>
            الطلب غير موجود
          </Text>
        </View>
      </View>
    );
  }

  const currentStep = getStatusIndex(order.status);
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + webTopPad + 10,
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 30,
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {STRINGS.orders.orderDetails}
        </Text>
      </View>

      <View style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.serviceHeader}>
          <Badge
            label={
              order.status === "cancelled"
                ? STRINGS.orders.cancelled
                : order.status === "completed"
                ? STRINGS.orders.done
                : order.status === "in_progress"
                ? STRINGS.orders.inProgress
                : order.status === "accepted"
                ? STRINGS.orders.accepted
                : order.status === "offers_received"
                ? "عروض مستلمة"
                : STRINGS.orders.pending
            }
            variant={
              order.status === "completed"
                ? "success"
                : order.status === "cancelled"
                ? "error"
                : "warning"
            }
          />
          <Text style={[styles.serviceName, { color: colors.foreground }]}>
            {order.serviceName}
          </Text>
        </View>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>
          {order.categoryName}
        </Text>
        {order.price && (
          <Text style={[styles.price, { color: colors.primary }]}>
            {order.price} {STRINGS.common.sar}
          </Text>
        )}
      </View>

      {order.status !== "cancelled" && (
        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>
            حالة الطلب
          </Text>
          {STATUS_STEPS.map((step, i) => {
            const isDone = i <= currentStep;
            const isActive = i === currentStep;
            return (
              <View key={step.key} style={styles.stepRow}>
                <View style={styles.stepLineArea}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: isDone ? colors.primary : colors.border,
                        borderColor: isActive ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    {isDone && (
                      <Feather name="check" size={12} color="#fff" />
                    )}
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.stepLine,
                        {
                          backgroundColor: i < currentStep ? colors.primary : colors.border,
                        },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    {
                      color: isDone ? colors.foreground : colors.mutedForeground,
                      fontFamily: isActive ? "Inter_700Bold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={[styles.detailsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
          تفاصيل الطلب
        </Text>
        <DetailRow
          icon="map-pin"
          label="العنوان"
          value={order.address}
          colors={colors}
        />
        <DetailRow
          icon="calendar"
          label="الموعد"
          value={new Date(order.scheduledAt).toLocaleDateString("ar-SA")}
          colors={colors}
        />
        {order.providerName && (
          <DetailRow
            icon="user"
            label="مزود الخدمة"
            value={order.providerName}
            colors={colors}
          />
        )}
        {order.notes && (
          <DetailRow
            icon="file-text"
            label="ملاحظات"
            value={order.notes}
            colors={colors}
          />
        )}
      </View>

      {order.status === "completed" && order.rating && (
        <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailsTitle, { color: colors.foreground }]}>
            تقييمك
          </Text>
          <StarRating rating={order.rating} size={24} />
          {order.review && (
            <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>
              "{order.review}"
            </Text>
          )}
        </View>
      )}

      {["pending", "offers_received"].includes(order.status) && (
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.destructive }]}
          onPress={() => updateRequest(order.id, { status: "cancelled" })}
        >
          <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>
            {STRINGS.request.cancel}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Text style={[styles.detailValue, { color: colors.foreground }]}>
          {value}
        </Text>
        <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
      <Feather name={icon} size={18} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  backBtn: { padding: 4, marginEnd: 12 },
  backBtnAlt: { padding: 16 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  serviceCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 6,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  category: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  price: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginTop: 4,
  },
  stepsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 0,
  },
  stepsTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: 12,
    justifyContent: "flex-start",
  },
  stepLineArea: {
    alignItems: "center",
    width: 24,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  stepLine: {
    width: 2,
    height: 28,
  },
  stepLabel: {
    fontSize: 14,
    paddingTop: 4,
    flex: 1,
    textAlign: "right",
  },
  detailsCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 4,
  },
  detailsTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  detailLeft: { alignItems: "flex-end", flex: 1, marginEnd: 12 },
  detailLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  ratingCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    gap: 10,
    alignItems: "flex-end",
  },
  reviewText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "right",
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
