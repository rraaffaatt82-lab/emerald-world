import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useData, PROVIDERS_DATA } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";

const STATUS_STEPS = [
  { key: "pending", label: "تم الإرسال", icon: "send" },
  { key: "offers_received", label: "عروض مستلمة", icon: "inbox" },
  { key: "accepted", label: "تم القبول", icon: "check-circle" },
  { key: "in_progress", label: "جارٍ التنفيذ", icon: "activity" },
  { key: "completed", label: "مكتمل", icon: "star" },
];

function getStatusIndex(status: string) {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2);
}

export default function OrderDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { requests, updateRequest, acceptOffer, cancelRequest } = useData();
  const order = requests.find((o) => o.id === id);
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const [confirmOffer, setConfirmOffer] = useState<{ offerId: string; providerName: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={[styles.backBtnAlt, { paddingTop: insets.top + 10 }]} onPress={() => router.back()}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={[styles.notFound, { color: colors.foreground }]}>الطلب غير موجود</Text>
        </View>
      </View>
    );
  }

  const currentStep = getStatusIndex(order.status);
  const pendingOffers = order.offers.filter((o) => o.status === "pending");
  const acceptedOffer = order.offers.find((o) => o.status === "accepted");

  function handleAcceptOffer(offerId: string, providerName: string) {
    setConfirmOffer({ offerId, providerName });
  }

  function doAcceptOffer() {
    if (!confirmOffer || !order) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptOffer(order.id, confirmOffer.offerId);
    setConfirmOffer(null);
  }

  function handleCancelRequest() {
    setShowCancelConfirm(true);
  }

  function doCancelRequest() {
    if (!order) return;
    setShowCancelConfirm(false);
    cancelRequest(order.id);
    router.back();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + webTopPad + 10, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 30 },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{STRINGS.orders.orderDetails}</Text>
      </View>

      <View style={[styles.serviceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.serviceHeader}>
          <Badge
            label={
              order.status === "cancelled" ? STRINGS.orders.cancelled :
              order.status === "completed" ? STRINGS.orders.done :
              order.status === "in_progress" ? STRINGS.orders.inProgress :
              order.status === "accepted" ? STRINGS.orders.accepted :
              order.status === "offers_received" ? "عروض مستلمة" :
              STRINGS.orders.pending
            }
            variant={
              order.status === "completed" ? "success" :
              order.status === "cancelled" ? "error" :
              order.status === "offers_received" ? "accent" : "warning"
            }
          />
          <Text style={[styles.serviceName, { color: colors.foreground }]}>{order.serviceName}</Text>
        </View>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{order.categoryName}</Text>
        {order.price && (
          <Text style={[styles.price, { color: colors.primary }]}>{order.price} {STRINGS.common.sar}</Text>
        )}
        <View style={styles.addressRow}>
          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
          <Text style={[styles.addressText, { color: colors.mutedForeground }]}> {order.address}</Text>
        </View>
      </View>

      {order.status !== "cancelled" && (
        <View style={[styles.stepsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.stepsTitle, { color: colors.foreground }]}>حالة الطلب</Text>
          <View style={styles.stepsRow}>
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStep;
              const isActive = i === currentStep;
              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={[styles.stepCircle, {
                    backgroundColor: isDone ? colors.primary : colors.border,
                    borderWidth: isActive ? 2 : 0,
                    borderColor: colors.primary,
                  }]}>
                    <Feather name={step.icon as any} size={13} color={isDone ? "#fff" : colors.mutedForeground} />
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepConnector, { backgroundColor: i < currentStep ? colors.primary : colors.border }]} />
                  )}
                  <Text style={[styles.stepLabel, { color: isDone ? colors.primary : colors.mutedForeground, fontFamily: isActive ? "Inter_700Bold" : "Inter_400Regular" }]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {order.status === "offers_received" && pendingOffers.length > 0 && (
        <View style={styles.offersSection}>
          <View style={styles.offersSectionHeader}>
            <View style={[styles.offersCountBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.offersCountText}>{pendingOffers.length}</Text>
            </View>
            <Text style={[styles.offersSectionTitle, { color: colors.foreground }]}>العروض الواردة</Text>
          </View>
          <Text style={[styles.offersHint, { color: colors.mutedForeground }]}>
            اختاري العرض المناسب — معلومات الاتصال تظهر بعد القبول
          </Text>
          {pendingOffers.map((offer) => {
            const providerData = PROVIDERS_DATA.find((p) => p.id === offer.providerId);
            const avatarColor = providerData?.avatarColor || colors.primary;
            return (
              <View key={offer.id} style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.offerTop}>
                  <View style={styles.offerPriceArea}>
                    <Text style={[styles.offerPrice, { color: colors.primary }]}>{offer.price} د.أ</Text>
                    <View style={styles.etaRow}>
                      <Feather name="clock" size={13} color={colors.mutedForeground} />
                      <Text style={[styles.etaText, { color: colors.mutedForeground }]}> {offer.eta} دقيقة</Text>
                    </View>
                  </View>
                  <View style={styles.offerProviderRow}>
                    <View style={styles.offerProviderInfo}>
                      <View style={styles.nameVerified}>
                        {offer.isVerified && (
                          <View style={[styles.verifiedIcon, { backgroundColor: colors.success }]}>
                            <Feather name="check" size={10} color="#fff" />
                          </View>
                        )}
                        <Text style={[styles.offerProviderName, { color: colors.foreground }]}>
                          {offer.providerFirstName || offer.providerName.split(" ")[0]}
                        </Text>
                        <Text style={[{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }]}>
                          (الاسم الأول فقط)
                        </Text>
                      </View>
                      <View style={styles.providerMeta}>
                        <StarRating rating={offer.providerRating} size={13} />
                        <Text style={[styles.providerMetaText, { color: colors.mutedForeground }]}>
                          · {offer.providerTotalOrders} طلب · {offer.providerType === "salon" ? "صالون" : "فريلانسر"}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.offerAvatar, { backgroundColor: avatarColor }]}>
                      <Text style={styles.offerAvatarText}>{getInitials(offer.providerName)}</Text>
                    </View>
                  </View>
                </View>

                {offer.note && (
                  <View style={[styles.offerNote, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.offerNoteText, { color: colors.mutedForeground }]}>
                      💬 {offer.note}
                    </Text>
                  </View>
                )}

                {providerData?.portfolioPhotos && providerData.portfolioPhotos.length > 0 && (
                  <View style={[styles.portfolioRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.portfolioLabel, { color: colors.mutedForeground }]}>
                      📸 معرض الأعمال ({providerData.portfolioPhotos.length})
                    </Text>
                    <View style={styles.portfolioThumbsRow}>
                      {providerData.portfolioPhotos.slice(0, 3).map((photo, i) => (
                        <View key={i} style={[styles.portfolioThumb, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                          <Feather name="image" size={16} color={colors.primary} />
                        </View>
                      ))}
                      {providerData.portfolioPhotos.length > 3 && (
                        <View style={[styles.portfolioThumb, { backgroundColor: colors.primary + "20", borderColor: colors.primary }]}>
                          <Text style={{ color: colors.primary, fontSize: 11, fontFamily: "Inter_700Bold" }}>
                            +{providerData.portfolioPhotos.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                <View style={[styles.privacyHint, { backgroundColor: colors.accent + "10" }]}>
                  <Feather name="eye-off" size={13} color={colors.accent} />
                  <Text style={[styles.privacyHintText, { color: colors.accent }]}>
                    رقم الهاتف مخفي — يظهر بعد القبول
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAcceptOffer(offer.id, offer.providerName)}
                >
                  <Feather name="check" size={16} color="#fff" />
                  <Text style={styles.acceptBtnText}>قبول هذا العرض</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      {order.status === "accepted" && acceptedOffer && order.contactRevealed && (
        <View style={[styles.contactCard, { backgroundColor: colors.success + "10", borderColor: colors.success + "30" }]}>
          <Feather name="unlock" size={18} color={colors.success} />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[styles.contactTitle, { color: colors.success }]}>تم قبول العرض — معلومات الاتصال</Text>
            <Text style={[styles.contactName, { color: colors.foreground }]}>{order.providerName}</Text>
            {order.providerPhone && (
              <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.providerPhone}`)}>
                <Text style={[styles.contactPhone, { color: colors.primary }]}>
                  📞 {order.providerPhone}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {["accepted", "in_progress"].includes(order.status) && acceptedOffer && (
        <TouchableOpacity
          style={[styles.chatBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: "/chat/[requestId]", params: { requestId: order.id } })}
        >
          <Feather name="message-circle" size={20} color="#fff" />
          <Text style={styles.chatBtnText}>محادثة مع {order.providerName || "المزودة"}</Text>
        </TouchableOpacity>
      )}

      {order.status === "completed" && order.rating && (
        <View style={[styles.ratingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.detailsTitle, { color: colors.foreground }]}>تقييمك</Text>
          <StarRating rating={order.rating} size={24} />
          {order.review && <Text style={[styles.reviewText, { color: colors.mutedForeground }]}>"{order.review}"</Text>}
        </View>
      )}

      {order.notes && (
        <View style={[styles.notesCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.detailsTitle, { color: colors.foreground }]}>ملاحظاتك</Text>
          <Text style={[styles.notesText, { color: colors.mutedForeground }]}>{order.notes}</Text>
        </View>
      )}

      {["pending", "offers_received"].includes(order.status) && (
        <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.destructive }]} onPress={handleCancelRequest}>
          <Feather name="x" size={16} color={colors.destructive} />
          <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>{STRINGS.request.cancel}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={!!confirmOffer} transparent animationType="fade" onRequestClose={() => setConfirmOffer(null)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setConfirmOffer(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Feather name="check-circle" size={32} color={colors.accent} style={{ alignSelf: "center" }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>قبول العرض</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>
              هل تريدين قبول عرض {confirmOffer?.providerName}؟ ستُشارَك معلومات الاتصال مع بعضكما.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmCancelBtn, { borderColor: colors.border }]} onPress={() => setConfirmOffer(null)}>
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmPrimaryBtn, { backgroundColor: colors.accent }]} onPress={doAcceptOffer}>
                <Text style={styles.confirmPrimaryText}>قبول</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showCancelConfirm} transparent animationType="fade" onRequestClose={() => setShowCancelConfirm(false)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setShowCancelConfirm(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Feather name="x-circle" size={32} color={colors.destructive} style={{ alignSelf: "center" }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>إلغاء الطلب</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>هل أنت متأكدة؟ لا يمكن التراجع بعد الإلغاء.</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmCancelBtn, { borderColor: colors.border }]} onPress={() => setShowCancelConfirm(false)}>
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>تراجع</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmPrimaryBtn, { backgroundColor: colors.destructive }]} onPress={doCancelRequest}>
                <Text style={styles.confirmPrimaryText}>إلغاء الطلب</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  backBtn: { padding: 4, marginEnd: 12 },
  backBtnAlt: { padding: 16 },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 16, fontFamily: "Inter_400Regular" },
  serviceCard: { borderRadius: 18, padding: 18, borderWidth: 1, gap: 6 },
  serviceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  serviceName: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "right" },
  category: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  price: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "right" },
  addressRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  addressText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  stepsCard: { borderRadius: 18, padding: 18, borderWidth: 1, gap: 16 },
  stepsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  stepsRow: { flexDirection: "row", justifyContent: "space-between" },
  stepItem: { alignItems: "center", flex: 1 },
  stepCircle: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  stepConnector: { position: "absolute", top: 17, left: "60%", right: "-60%", height: 2 },
  stepLabel: { fontSize: 10, textAlign: "center", marginTop: 6, lineHeight: 14 },
  offersSection: { gap: 12 },
  offersSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10 },
  offersSectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  offersCountBadge: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  offersCountText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  offersHint: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  offerCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  offerTop: { padding: 14, gap: 12 },
  offerPriceArea: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  offerPrice: { fontSize: 24, fontFamily: "Inter_700Bold" },
  etaRow: { flexDirection: "row", alignItems: "center" },
  etaText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  offerProviderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  offerProviderInfo: { flex: 1, alignItems: "flex-end", gap: 4 },
  nameVerified: { flexDirection: "row", alignItems: "center", gap: 6 },
  verifiedIcon: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  offerProviderName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  providerMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  providerMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  offerAvatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  offerAvatarText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  offerNote: { marginHorizontal: 14, borderRadius: 12, padding: 10 },
  offerNoteText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  portfolioRow: { marginHorizontal: 14, marginBottom: 8, borderTopWidth: 1, paddingTop: 10, gap: 8 },
  portfolioLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  portfolioThumbsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  portfolioThumb: { width: 50, height: 50, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  privacyHint: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 10, gap: 8 },
  privacyHintText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  acceptBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, margin: 14, marginTop: 0, borderRadius: 14, gap: 8 },
  acceptBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  contactCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 18, borderWidth: 1, gap: 12 },
  contactTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  contactName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  contactPhone: { fontSize: 15, fontFamily: "Inter_700Bold", marginTop: 4 },
  ratingCard: { borderRadius: 18, padding: 18, borderWidth: 1, gap: 12, alignItems: "center" },
  detailsTitle: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  reviewText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", fontStyle: "italic" },
  notesCard: { borderRadius: 14, padding: 14, borderWidth: 1, gap: 8 },
  notesText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 22 },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 14, borderWidth: 1.5, gap: 8 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  chatBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, gap: 10 },
  chatBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmBox: { borderRadius: 20, padding: 24, width: "100%", gap: 12 },
  confirmTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  confirmCancelBtn: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  confirmCancelText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  confirmPrimaryBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  confirmPrimaryText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
