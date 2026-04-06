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
import { StarRating } from "@/components/ui/StarRating";

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  offer_received: { icon: "inbox", color: "#9c27b0" },
  offer_accepted: { icon: "check-circle", color: "#4caf50" },
  offer_rejected: { icon: "x-circle", color: "#f44336" },
  wallet_topup_approved: { icon: "dollar-sign", color: "#4caf50" },
  wallet_topup_rejected: { icon: "dollar-sign", color: "#f44336" },
  wallet_topup_request: { icon: "dollar-sign", color: "#ff9800" },
  service_started: { icon: "play-circle", color: "#2196f3" },
  service_completed: { icon: "star", color: "#c8a951" },
  account_suspended: { icon: "pause-circle", color: "#f44336" },
  account_approved: { icon: "user-check", color: "#4caf50" },
  package_approved: { icon: "box", color: "#4caf50" },
  new_request: { icon: "bell", color: "#c2185b" },
  rating_request: { icon: "star", color: "#ff9800" },
  chat_message: { icon: "message-circle", color: "#2196f3" },
  offer_expiry_warning: { icon: "clock", color: "#ff9800" },
  appointment_reminder: { icon: "calendar", color: "#9c27b0" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ساعة`;
  return `${Math.floor(hrs / 24)} يوم`;
}

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notifications, markNotificationRead, markAllRead, updateRequest } = useData();
  const [ratingNotifId, setRatingNotifId] = useState<string | null>(null);
  const [ratingRequestId, setRatingRequestId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const myNotifications = notifications.filter((n) => n.userId === user?.id);
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  function handleSubmitRating() {
    if (rating > 0 && ratingRequestId) {
      updateRequest(ratingRequestId, { rating, review });
      markNotificationRead(ratingNotifId || "");
      setRatingNotifId(null);
      setRatingRequestId(null);
      setRating(0);
      setReview("");
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10 }]}>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.markAllBtn, { borderColor: colors.border }]}
            onPress={() => user && markAllRead(user.id)}
          >
            <Feather name="check-square" size={14} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>قراءة الكل</Text>
          </TouchableOpacity>
        )}
        <View style={styles.titleRow}>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadCount}>{unreadCount}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: colors.foreground }]}>الإشعارات</Text>
        </View>
      </View>

      <FlatList
        data={myNotifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Feather name="bell-off" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>لا توجد إشعارات</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              ستظهر إشعاراتك هنا عند وصولها
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const iconInfo = TYPE_ICONS[item.type] || { icon: "bell", color: colors.primary };
          const isRating = item.type === "rating_request";
          const isChat = item.type === "chat_message";
          return (
            <TouchableOpacity
              style={[
                styles.notifCard,
                {
                  backgroundColor: item.isRead ? colors.card : colors.primary + "08",
                  borderColor: item.isRead ? colors.border : colors.primary + "40",
                },
              ]}
              onPress={() => {
                markNotificationRead(item.id);
                if (isChat && item.relatedId) router.push(`/chat/${item.relatedId}`);
              }}
            >
              <View style={styles.notifContent}>
                <Text style={[styles.notifBody, { color: colors.mutedForeground }]}>{item.body}</Text>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  منذ {timeAgo(item.createdAt)}
                </Text>
                {isRating && item.relatedId && (
                  <TouchableOpacity
                    style={[styles.rateNowBtn, { backgroundColor: "#ff9800" }]}
                    onPress={() => {
                      markNotificationRead(item.id);
                      setRatingNotifId(item.id);
                      setRatingRequestId(item.relatedId || null);
                      setRating(0);
                      setReview("");
                    }}
                  >
                    <Feather name="star" size={13} color="#fff" />
                    <Text style={styles.rateNowText}>قيّمي الآن</Text>
                  </TouchableOpacity>
                )}
                {isChat && (
                  <TouchableOpacity
                    style={[styles.rateNowBtn, { backgroundColor: "#2196f3" }]}
                    onPress={() => { markNotificationRead(item.id); if (item.relatedId) router.push(`/chat/${item.relatedId}`); }}
                  >
                    <Feather name="message-circle" size={13} color="#fff" />
                    <Text style={styles.rateNowText}>فتح المحادثة</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.notifLeft}>
                <View style={[styles.iconCircle, { backgroundColor: iconInfo.color + "20" }]}>
                  <Feather name={iconInfo.icon as any} size={20} color={iconInfo.color} />
                </View>
                {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={!!ratingRequestId} transparent animationType="slide" onRequestClose={() => setRatingNotifId(null)}>
        <TouchableOpacity style={rStyles.overlay} activeOpacity={1} onPress={() => { setRatingNotifId(null); setRatingRequestId(null); }}>
          <TouchableOpacity activeOpacity={1} style={[rStyles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={rStyles.handle} />
            <Text style={[rStyles.title, { color: colors.foreground }]}>كيف كانت تجربتك؟</Text>
            <Text style={[rStyles.sub, { color: colors.mutedForeground }]}>تقييمك يساعد الأخريات في الاختيار</Text>
            <StarRating value={rating} onChange={setRating} size={36} />
            <TextInput
              style={[rStyles.reviewInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.muted }]}
              placeholder="شاركي تجربتك بكلمة أو جملة..."
              placeholderTextColor={colors.mutedForeground}
              value={review}
              onChangeText={setReview}
              multiline
              textAlign="right"
            />
            <TouchableOpacity
              style={[rStyles.submitBtn, { backgroundColor: rating > 0 ? "#ff9800" : colors.muted }]}
              onPress={handleSubmitRating}
              disabled={rating === 0}
            >
              <Feather name="star" size={16} color={rating > 0 ? "#fff" : colors.mutedForeground} />
              <Text style={[rStyles.submitText, { color: rating > 0 ? "#fff" : colors.mutedForeground }]}>إرسال التقييم</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const rStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 16, alignItems: "center" },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "center" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  reviewInput: { width: "100%", borderRadius: 12, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  submitBtn: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
  submitText: { fontSize: 16, fontFamily: "Inter_700Bold" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  unreadBadge: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  unreadCount: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  markAllText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 80, gap: 14 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
  notifCard: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
  notifLeft: { alignItems: "center", gap: 8 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifContent: { flex: 1, alignItems: "flex-end", gap: 4 },
  notifTitle: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  rateNowBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, alignSelf: "flex-end", marginTop: 4 },
  rateNowText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
