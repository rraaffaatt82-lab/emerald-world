import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
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
import { useData, SERVICES, CATEGORIES } from "@/context/DataContext";
import { Badge } from "@/components/ui/Badge";
import { toHijriShort } from "@/utils/date";

type FilterTab = "available" | "my_offers" | "accepted";

export default function ProviderRequestsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getPendingOfferRequests, submitOffer, providers, getProviderOffers, requests } = useData();
  const [filterTab, setFilterTab] = useState<FilterTab>("available");
  const [offerModal, setOfferModal] = useState<{ requestId: string; serviceName: string } | null>(null);
  const [offerPrice, setOfferPrice] = useState("");
  const [offerEta, setOfferEta] = useState("20");
  const [offerNote, setOfferNote] = useState("");
  const [offerError, setOfferError] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const provider = providers.find((p) => p.id === user?.id);
  const pendingRequests = getPendingOfferRequests(user?.id || "");
  const myOffers = getProviderOffers(user?.id || "");

  const myOfferRequests = requests.filter((r) =>
    r.offers.some((o) => o.providerId === user?.id && o.status === "pending")
  );
  const acceptedRequests = requests.filter((r) =>
    r.offers.some((o) => o.providerId === user?.id && o.status === "accepted")
  );

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "available", label: "متاحة", count: pendingRequests.length },
    { key: "my_offers", label: "عروضي", count: myOfferRequests.length },
    { key: "accepted", label: "مقبولة", count: acceptedRequests.length },
  ];

  if (provider?.status === "pending") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>الطلبات الواردة</Text>
        </View>
        <View style={styles.pendingArea}>
          <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.warning + "40" }]}>
            <Feather name="clock" size={48} color={colors.warning} />
            <Text style={[styles.pendingTitle, { color: colors.foreground }]}>حسابك قيد المراجعة</Text>
            <Text style={[styles.pendingDesc, { color: colors.mutedForeground }]}>
              يقوم فريقنا بمراجعة بياناتك وتوثيق هويتك. سيتم إخطارك فور الموافقة.
            </Text>
            <View style={[styles.pendingInfo, { backgroundColor: colors.muted }]}>
              <Text style={[styles.pendingInfoText, { color: colors.mutedForeground }]}>
                عادةً ما تستغرق العملية 24-48 ساعة
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (provider?.status === "suspended") {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>الطلبات الواردة</Text>
        </View>
        <View style={styles.pendingArea}>
          <View style={[styles.pendingCard, { backgroundColor: colors.card, borderColor: colors.destructive + "40" }]}>
            <Feather name="alert-circle" size={48} color={colors.destructive} />
            <Text style={[styles.pendingTitle, { color: colors.foreground }]}>تم تعليق حسابك</Text>
            <Text style={[styles.pendingDesc, { color: colors.mutedForeground }]}>
              تواصل مع الإدارة لمعرفة سبب التعليق والحل.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  function handleSubmitOffer() {
    if (!offerModal || !user) return;
    const price = parseFloat(offerPrice);
    if (isNaN(price) || price < 30) {
      setOfferError("يرجى إدخال سعر صحيح (30 ريال كحد أدنى)");
      return;
    }
    if (!provider) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    submitOffer({
      requestId: offerModal.requestId,
      providerId: user.id,
      providerName: user.name,
      providerRating: provider.rating,
      providerTotalOrders: provider.totalOrders,
      providerType: provider.type,
      isVerified: provider.isVerified,
      price,
      eta: parseInt(offerEta) || 20,
      note: offerNote || undefined,
    });
    setOfferModal(null);
    setOfferPrice("");
    setOfferEta("20");
    setOfferNote("");
    setOfferError("");
    setFilterTab("my_offers");
  }

  const currentData =
    filterTab === "available"
      ? pendingRequests
      : filterTab === "my_offers"
      ? myOfferRequests
      : acceptedRequests;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>الطلبات الواردة</Text>
        <View style={[styles.statusPill, { backgroundColor: provider?.isAvailable ? colors.success + "20" : colors.muted }]}>
          <View style={[styles.dot, { backgroundColor: provider?.isAvailable ? colors.success : colors.mutedForeground }]} />
          <Text style={[styles.statusText, { color: provider?.isAvailable ? colors.success : colors.mutedForeground }]}>
            {provider?.isAvailable ? "متاح" : "غير متاح"}
          </Text>
        </View>
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
        {filterTabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, filterTab === t.key && { backgroundColor: colors.card }]}
            onPress={() => setFilterTab(t.key)}
          >
            <Text style={[
              styles.tabText,
              { color: filterTab === t.key ? colors.primary : colors.mutedForeground,
                fontFamily: filterTab === t.key ? "Inter_700Bold" : "Inter_400Regular" },
            ]}>
              {t.label}
              {t.count > 0 ? ` (${t.count})` : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={currentData}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {filterTab === "available" ? "لا توجد طلبات حالياً" : filterTab === "my_offers" ? "لم ترسلي عروضاً بعد" : "لا توجد عروض مقبولة"}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {filterTab === "available" ? "ستظهر الطلبات الجديدة هنا فور إرسالها من عملاء قريبين" : filterTab === "my_offers" ? "قدّمي عروضك على الطلبات المتاحة" : "ستظهر هنا الطلبات التي قبلت العميلة عرضك فيها"}
            </Text>
          </View>
        )}
        renderItem={({ item }) => {
          const service = SERVICES.find((s) => s.id === item.serviceId);
          const cat = CATEGORIES.find((c) => c.id === service?.categoryId);
          const alreadyOffered = item.offers.some((o) => o.providerId === user?.id);
          const myOffer = item.offers.find((o) => o.providerId === user?.id);
          const isAcceptedOffer = myOffer?.status === "accepted";

          return (
            <View style={[styles.requestCard, {
              backgroundColor: colors.card,
              borderColor: isAcceptedOffer ? colors.success + "50" : alreadyOffered ? colors.primary + "40" : colors.border,
            }]}>
              <View style={styles.cardTop}>
                <View style={[styles.catIcon, { backgroundColor: (cat?.color || colors.primary) + "20" }]}>
                  <Feather name={(cat?.icon || "scissors") as any} size={20} color={cat?.color || colors.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardServiceName, { color: colors.foreground }]}>{item.serviceName}</Text>
                  <Text style={[styles.cardCat, { color: colors.mutedForeground }]}>{item.categoryName}</Text>
                  <View style={styles.cardMeta}>
                    <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}> {item.address}</Text>
                  </View>
                  <View style={styles.cardMeta}>
                    <Feather name="calendar" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
                      {" "}{toHijriShort(item.scheduledAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={[styles.budgetLabel, { color: colors.mutedForeground }]}>ميزانية</Text>
                  <Text style={[styles.budgetVal, { color: colors.primary }]}>{item.price} د.أ</Text>
                  <Text style={[styles.offersCount, { color: colors.mutedForeground }]}>
                    {item.offers.length} عروض
                  </Text>
                </View>
              </View>

              {item.notes ? (
                <View style={[styles.notes, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.notesText, { color: colors.mutedForeground }]}>
                    ملاحظة: {item.notes}
                  </Text>
                </View>
              ) : null}

              {filterTab === "available" && (
                <View style={styles.privacyNote}>
                  <Feather name="shield" size={14} color={colors.accent} />
                  <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
                    معلومات العميل مخفية حتى قبول العرض
                  </Text>
                </View>
              )}

              {isAcceptedOffer ? (
                <View style={[styles.acceptedBadge, { backgroundColor: colors.success + "15" }]}>
                  <Feather name="check-circle" size={16} color={colors.success} />
                  <Text style={[styles.acceptedBadgeText, { color: colors.success }]}>
                    تم قبول عرضك! — {item.contactRevealed ? `تواصل: ${item.customerPhone || "—"}` : "—"}
                  </Text>
                </View>
              ) : alreadyOffered ? (
                <View style={[styles.alreadyOffered, { backgroundColor: colors.primary + "15" }]}>
                  <Feather name="clock" size={16} color={colors.primary} />
                  <Text style={[styles.alreadyOfferedText, { color: colors.primary }]}>
                    عرضك: {myOffer?.price} د.أ — بانتظار العميل
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.offerBtn, { backgroundColor: colors.accent }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setOfferModal({ requestId: item.id, serviceName: item.serviceName });
                    setOfferPrice(String(item.price));
                  }}
                >
                  <Feather name="send" size={16} color="#fff" />
                  <Text style={styles.offerBtnText}>تقديم عرض</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      <Modal
        visible={!!offerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setOfferModal(null)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={styles.modalOverlay}>
            <View style={[styles.offerModal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setOfferModal(null)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>تقديم عرض</Text>
              </View>
              <Text style={[styles.modalService, { color: colors.mutedForeground }]}>
                {offerModal?.serviceName}
              </Text>

              <View style={[styles.privacyBanner, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "30" }]}>
                <Feather name="eye-off" size={16} color={colors.accent} />
                <Text style={[styles.privacyBannerText, { color: colors.accent }]}>
                  معلوماتك ستظهر للعميل فقط عند قبول العرض
                </Text>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>سعر العرض (ريال)</Text>
              <View style={[styles.priceInput, { borderColor: offerError ? colors.destructive : colors.border, backgroundColor: colors.muted }]}>
                <TextInput
                  style={[styles.priceText, { color: colors.foreground }]}
                  value={offerPrice}
                  onChangeText={(t) => { setOfferPrice(t); setOfferError(""); }}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="right"
                />
                <Text style={[styles.currencyText, { color: colors.mutedForeground }]}>د.أ</Text>
              </View>
              {offerError !== "" && (
                <Text style={{ color: colors.destructive, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular" }}>{offerError}</Text>
              )}

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>وقت الوصول (دقيقة)</Text>
              <View style={styles.etaRow}>
                {[10, 15, 20, 30, 45, 60].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.etaChip, {
                      backgroundColor: offerEta === String(t) ? colors.primary : colors.muted,
                      borderColor: offerEta === String(t) ? colors.primary : colors.border,
                    }]}
                    onPress={() => setOfferEta(String(t))}
                  >
                    <Text style={[styles.etaChipText, { color: offerEta === String(t) ? "#fff" : colors.mutedForeground }]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ملاحظة (اختياري)</Text>
              <TextInput
                style={[styles.noteInput, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
                value={offerNote}
                onChangeText={setOfferNote}
                placeholder="أضف ملاحظة للعميل..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={2}
                textAlign="right"
                textAlignVertical="top"
              />

              <View style={styles.commissionNote}>
                <Feather name="info" size={14} color={colors.mutedForeground} />
                <Text style={[styles.commissionText, { color: colors.mutedForeground }]}>
                  {provider?.freeServicesLeft && provider.freeServicesLeft > 0
                    ? `لديك ${provider.freeServicesLeft} خدمة مجانية بدون عمولة`
                    : `عمولة المنصة: ${provider?.commission || 15}% من قيمة الخدمة`}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.accent }]}
                onPress={handleSubmitOffer}
              >
                <Feather name="send" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>إرسال العرض</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tabBar: { flexDirection: "row", margin: 12, borderRadius: 12, padding: 4 },
  tabItem: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabText: { fontSize: 12 },
  list: { paddingHorizontal: 12, paddingTop: 4, gap: 12 },
  empty: { alignItems: "center", paddingVertical: 60, gap: 14 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  emptyDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 40, lineHeight: 22 },
  requestCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  catIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 4 },
  cardServiceName: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  cardCat: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  cardMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  cardMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  cardRight: { alignItems: "flex-end", gap: 4 },
  budgetLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  budgetVal: { fontSize: 16, fontFamily: "Inter_700Bold" },
  offersCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  notes: { padding: 10, borderRadius: 10 },
  notesText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  privacyNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end" },
  privacyText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  acceptedBadge: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, gap: 8 },
  acceptedBadgeText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
  alreadyOffered: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderRadius: 10, gap: 8 },
  alreadyOfferedText: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  offerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14, borderRadius: 12, gap: 8 },
  offerBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  offerModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalService: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  privacyBanner: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  privacyBannerText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  priceInput: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  priceText: { flex: 1, fontSize: 22, fontFamily: "Inter_700Bold" },
  currencyText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  etaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  etaChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  etaChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  noteInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 70 },
  commissionNote: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-end" },
  commissionText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, gap: 10 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  pendingArea: { flex: 1, padding: 20, justifyContent: "center" },
  pendingCard: { borderRadius: 20, padding: 28, borderWidth: 1.5, alignItems: "center", gap: 14 },
  pendingTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  pendingDesc: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 24 },
  pendingInfo: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  pendingInfoText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
