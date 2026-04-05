import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { OrderCard } from "@/components/ui/OrderCard";
import { StarRating } from "@/components/ui/StarRating";

type Tab = "active" | "completed" | "cancelled";

export default function OrdersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getRequestsByCustomer, updateRequest } = useData();
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [ratingOrderId, setRatingOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const allOrders = user ? getRequestsByCustomer(user.id) : [];

  const filteredOrders = allOrders.filter((o) => {
    if (activeTab === "active")
      return ["pending", "offers_received", "accepted", "in_progress"].includes(o.status);
    if (activeTab === "completed") return o.status === "completed";
    return o.status === "cancelled";
  });

  function handleSubmitRating() {
    if (ratingOrderId && rating > 0) {
      updateRequest(ratingOrderId, { rating, review });
      setRatingOrderId(null);
      setRating(0);
      setReview("");
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "active", label: STRINGS.orders.active },
    { key: "completed", label: STRINGS.orders.completed },
    { key: "cancelled", label: STRINGS.orders.cancelled },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {STRINGS.orders.title}
        </Text>
        <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tab,
                activeTab === t.key && { backgroundColor: colors.card },
              ]}
              onPress={() => setActiveTab(t.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === t.key ? colors.primary : colors.mutedForeground,
                    fontFamily:
                      activeTab === t.key ? "Inter_700Bold" : "Inter_400Regular",
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + webBottomPad + 90 },
        ]}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onPress={() =>
              router.push({ pathname: "/order/[id]", params: { id: item.id } })
            }
            onRate={() => {
              setRatingOrderId(item.id);
              setRating(0);
              setReview("");
            }}
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="clipboard" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {STRINGS.orders.noOrders}
            </Text>
            {activeTab === "active" && (
              <TouchableOpacity
                style={[styles.orderNowBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/request-service")}
              >
                <Text style={styles.orderNowText}>{STRINGS.home.requestService}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        scrollEnabled={filteredOrders.length > 0}
      />

      <Modal visible={!!ratingOrderId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.ratingModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.ratingTitle, { color: colors.foreground }]}>
              {STRINGS.rating.title}
            </Text>
            <Text style={[styles.ratingQuestion, { color: colors.mutedForeground }]}>
              {STRINGS.rating.howWas}
            </Text>
            <StarRating
              rating={rating}
              size={36}
              interactive
              onRate={setRating}
            />
            <TextInput
              style={[
                styles.reviewInput,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              value={review}
              onChangeText={setReview}
              placeholder={STRINGS.rating.addComment}
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlign="right"
            />
            <View style={styles.ratingActions}>
              <TouchableOpacity
                style={[styles.cancelRateBtn, { borderColor: colors.border }]}
                onPress={() => setRatingOrderId(null)}
              >
                <Text style={[styles.cancelRateText, { color: colors.mutedForeground }]}>
                  {STRINGS.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitRateBtn,
                  { backgroundColor: colors.primary },
                  rating === 0 && { opacity: 0.5 },
                ]}
                onPress={handleSubmitRating}
                disabled={rating === 0}
              >
                <Text style={styles.submitRateText}>{STRINGS.rating.submit}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 14,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  tabText: {
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  orderNowBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  orderNowText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  ratingModal: {
    padding: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    alignItems: "center",
    gap: 16,
  },
  ratingTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  ratingQuestion: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  reviewInput: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    textAlignVertical: "top",
  },
  ratingActions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelRateBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelRateText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  submitRateBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  submitRateText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
