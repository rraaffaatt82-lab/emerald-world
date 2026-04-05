import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
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
import { toHijriShort } from "@/utils/date";

export default function ProviderEarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    providers,
    walletTransactions,
    getRequestsByProvider,
    requestWalletTopup,
  } = useData();
  const [topupModal, setTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const provider = providers.find((p) => p.id === user?.id);
  const myJobs = getRequestsByProvider(user?.id || "");
  const completedJobs = myJobs.filter((r) => r.status === "completed");
  const totalEarned = completedJobs.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalCommission = totalEarned * ((provider?.commission || 15) / 100);
  const myTxs = walletTransactions.filter((t) => t.userId === user?.id).slice(0, 20);

  function openTopup() {
    setSubmitted(false);
    setTopupAmount("");
    setTopupNote("");
    setTopupModal(true);
  }

  function handleTopupRequest() {
    const amt = parseFloat(topupAmount);
    if (isNaN(amt) || amt < 50) return;
    requestWalletTopup(user!.id, user!.name, amt, topupNote || undefined);
    setSubmitted(true);
  }

  function closeTopup() {
    setTopupModal(false);
    setSubmitted(false);
    setTopupAmount("");
    setTopupNote("");
  }

  const statCards = [
    { label: "الرصيد الحالي", value: `${provider?.walletBalance || 0} د.أ`, icon: "credit-card", color: colors.primary },
    { label: "إجمالي الطلبات", value: String(provider?.totalOrders || 0), icon: "briefcase", color: colors.accent },
    { label: "إجمالي الأرباح", value: `${totalEarned} د.أ`, icon: "trending-up", color: colors.success },
    { label: "العمولات المدفوعة", value: `${totalCommission.toFixed(0)} د.أ`, icon: "percent", color: colors.warning },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>الأرباح والمحفظة</Text>
        <TouchableOpacity
          style={[styles.topupBtn, { backgroundColor: colors.primary }]}
          onPress={openTopup}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.topupBtnText}>طلب شحن</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {provider?.freeServicesLeft && provider.freeServicesLeft > 0 ? (
          <View style={[styles.banner, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "30" }]}>
            <Feather name="gift" size={18} color={colors.accent} />
            <Text style={[styles.bannerText, { color: colors.accent }]}>
              لديك {provider.freeServicesLeft} خدمة مجانية بدون عمولة
            </Text>
          </View>
        ) : null}

        {provider && provider.walletBalance < 100 && provider.freeServicesLeft === 0 && (
          <View style={[styles.banner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
            <Feather name="alert-triangle" size={16} color={colors.destructive} />
            <Text style={[styles.bannerText, { color: colors.destructive }]}>
              رصيدك منخفض! اطلب شحن قبل استقبال طلبات جديدة
            </Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          {statCards.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + "15" }]}>
                <Feather name={s.icon as any} size={20} color={s.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.commissionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.commissionTitle, { color: colors.foreground }]}>نظام العمولة</Text>
          <View style={styles.commissionRow}>
            <Text style={[styles.commissionVal, { color: colors.primary }]}>{provider?.commission || 15}%</Text>
            <Text style={[styles.commissionLabel, { color: colors.mutedForeground }]}>نسبة العمولة</Text>
          </View>
          <Text style={[styles.commissionDesc, { color: colors.mutedForeground }]}>
            تُخصم العمولة تلقائياً من رصيد المحفظة بعد إتمام كل خدمة. طلبات الشحن تحتاج موافقة الإدارة.
          </Text>
        </View>

        <Text style={[styles.historyTitle, { color: colors.foreground }]}>سجل المعاملات</Text>

        {myTxs.length === 0 ? (
          <View style={styles.emptyTx}>
            <Feather name="credit-card" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTxText, { color: colors.mutedForeground }]}>لا توجد معاملات</Text>
          </View>
        ) : (
          myTxs.map((tx) => (
            <View key={tx.id} style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.txIcon, {
                backgroundColor: tx.type === "credit" ? colors.success + "15" : colors.destructive + "15",
              }]}>
                <Feather
                  name={tx.type === "credit" ? "arrow-down-left" : "arrow-up-right"}
                  size={18}
                  color={tx.type === "credit" ? colors.success : colors.destructive}
                />
              </View>
              <View style={styles.txInfo}>
                <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>
                  {toHijriShort(tx.date)}
                </Text>
              </View>
              <Text style={[styles.txAmount, {
                color: tx.type === "credit" ? colors.success : colors.destructive,
              }]}>
                {tx.type === "credit" ? "+" : "-"}{tx.amount} د.أ
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={topupModal}
        transparent
        animationType="slide"
        onRequestClose={closeTopup}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.topupModal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeTopup}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب شحن المحفظة</Text>
            </View>

            {submitted ? (
              <View style={styles.successArea}>
                <View style={[styles.successIcon, { backgroundColor: colors.success + "20" }]}>
                  <Feather name="check-circle" size={40} color={colors.success} />
                </View>
                <Text style={[styles.successTitle, { color: colors.foreground }]}>تم إرسال الطلب!</Text>
                <Text style={[styles.successDesc, { color: colors.mutedForeground }]}>
                  ستتلقين إشعاراً فور موافقة الإدارة على شحن رصيدك
                </Text>
                <TouchableOpacity
                  style={[styles.doneBtn, { backgroundColor: colors.primary }]}
                  onPress={closeTopup}
                >
                  <Text style={styles.doneBtnText}>حسناً</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
                  سيتم مراجعة طلبك من قبل الإدارة وإشعارك فور الموافقة
                </Text>

                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>المبلغ المطلوب (د.أ) *</Text>
                <View style={[styles.amountInput, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <TextInput
                    style={[styles.amountText, { color: colors.foreground }]}
                    value={topupAmount}
                    onChangeText={setTopupAmount}
                    keyboardType="numeric"
                    placeholder="مثال: 500"
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="right"
                  />
                  <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>د.أ</Text>
                </View>

                <View style={styles.quickAmounts}>
                  {[100, 200, 500, 1000].map((a) => (
                    <TouchableOpacity
                      key={a}
                      style={[styles.quickAmt, { borderColor: colors.primary + "50" }]}
                      onPress={() => setTopupAmount(String(a))}
                    >
                      <Text style={[styles.quickAmtText, { color: colors.primary }]}>{a}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ملاحظة (اختياري)</Text>
                <TextInput
                  style={[styles.noteInput, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
                  value={topupNote}
                  onChangeText={setTopupNote}
                  placeholder="تفاصيل إضافية للإدارة..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={2}
                  textAlign="right"
                />

                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: colors.primary },
                    (isNaN(parseFloat(topupAmount)) || parseFloat(topupAmount) < 50) && { opacity: 0.5 },
                  ]}
                  onPress={handleTopupRequest}
                  disabled={isNaN(parseFloat(topupAmount)) || parseFloat(topupAmount) < 50}
                >
                  <Feather name="send" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>إرسال الطلب</Text>
                </TouchableOpacity>

                <Text style={[styles.minNote, { color: colors.mutedForeground }]}>
                  الحد الأدنى للشحن: 50 د.أ
                </Text>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  topupBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  topupBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 16 },
  banner: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  bannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  statCard: { width: "47%", borderRadius: 16, padding: 16, borderWidth: 1, gap: 8 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "right" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  commissionCard: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 12 },
  commissionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  commissionRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10 },
  commissionVal: { fontSize: 28, fontFamily: "Inter_700Bold" },
  commissionLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  commissionDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  historyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  emptyTx: { padding: 30, alignItems: "center", gap: 10 },
  emptyTxText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  txRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, alignItems: "flex-end" },
  txDesc: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  topupModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  amountInput: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  amountText: { flex: 1, fontSize: 28, fontFamily: "Inter_700Bold" },
  currencyLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  quickAmounts: { flexDirection: "row", gap: 10 },
  quickAmt: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  quickAmtText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  noteInput: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 60 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, gap: 10 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  minNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  successArea: { alignItems: "center", gap: 14, paddingVertical: 20 },
  successIcon: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" },
  successTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  successDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },
  doneBtn: { paddingHorizontal: 40, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
