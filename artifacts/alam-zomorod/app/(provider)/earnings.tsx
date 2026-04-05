import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
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

export default function ProviderEarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { providers, walletTransactions, getRequestsByProvider, addWalletTransaction, updateProvider } = useData();
  const [rechargeModal, setRechargeModal] = useState(false);
  const [amount, setAmount] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const provider = providers.find((p) => p.id === user?.id);
  const myJobs = getRequestsByProvider(user?.id || "");
  const completedJobs = myJobs.filter((r) => r.status === "completed");
  const totalEarned = completedJobs.reduce((sum, r) => sum + (r.price || 0), 0);
  const totalCommission = totalEarned * ((provider?.commission || 15) / 100);
  const myTxs = walletTransactions.filter((t) => t.userId === user?.id).slice(0, 20);

  function handleRecharge() {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt < 50) {
      Alert.alert("خطأ", "الحد الأدنى للشحن 50 ريال");
      return;
    }
    addWalletTransaction({ userId: user?.id || "", type: "credit", amount: amt, description: "شحن رصيد المحفظة", date: new Date().toISOString().split("T")[0] });
    if (provider) {
      updateProvider(provider.id, { walletBalance: provider.walletBalance + amt });
    }
    setRechargeModal(false);
    setAmount("");
    Alert.alert("تم", `تم شحن ${amt} ريال بنجاح`);
  }

  const statCards = [
    { label: "الرصيد الحالي", value: `${provider?.walletBalance || 0} ر.س`, icon: "credit-card", color: colors.primary },
    { label: "إجمالي الطلبات", value: String(provider?.totalOrders || 0), icon: "briefcase", color: colors.accent },
    { label: "إجمالي الأرباح", value: `${totalEarned} ر.س`, icon: "trending-up", color: colors.success },
    { label: "العمولات المدفوعة", value: `${totalCommission.toFixed(0)} ر.س`, icon: "percent", color: colors.warning },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>الأرباح والمحفظة</Text>
        <TouchableOpacity
          style={[styles.rechargeBtn, { backgroundColor: colors.primary }]}
          onPress={() => setRechargeModal(true)}
        >
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.rechargeBtnText}>شحن</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {provider?.freeServicesLeft && provider.freeServicesLeft > 0 ? (
          <View style={[styles.freeBanner, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "30" }]}>
            <Feather name="gift" size={18} color={colors.accent} />
            <Text style={[styles.freeBannerText, { color: colors.accent }]}>
              لديك {provider.freeServicesLeft} خدمة مجانية بدون عمولة
            </Text>
          </View>
        ) : null}

        {provider && provider.walletBalance < 100 && provider.freeServicesLeft === 0 && (
          <View style={[styles.lowBanner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
            <Feather name="alert-triangle" size={16} color={colors.destructive} />
            <Text style={[styles.lowBannerText, { color: colors.destructive }]}>
              رصيدك منخفض! اشحن قبل استقبال طلبات جديدة
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
            تُخصم العمولة تلقائياً من رصيد المحفظة بعد إتمام كل خدمة. تأكد من وجود رصيد كافٍ.
          </Text>
        </View>

        <Text style={[styles.historyTitle, { color: colors.foreground }]}>سجل المعاملات</Text>

        {myTxs.length === 0 ? (
          <View style={styles.emptyTx}>
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
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, {
                color: tx.type === "credit" ? colors.success : colors.destructive,
              }]}>
                {tx.type === "credit" ? "+" : "-"}{tx.amount} ر.س
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={rechargeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.rechargeModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>شحن المحفظة</Text>
            <View style={[styles.amountInput, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <TextInput
                style={[styles.amountText, { color: colors.foreground }]}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
                autoFocus
              />
              <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>ريال</Text>
            </View>
            <View style={styles.quickAmounts}>
              {[100, 200, 500, 1000].map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.quickAmt, { borderColor: colors.primary + "50" }]}
                  onPress={() => setAmount(String(a))}
                >
                  <Text style={[styles.quickAmtText, { color: colors.primary }]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setRechargeModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleRecharge}
              >
                <Text style={styles.confirmText}>شحن</Text>
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
  header: { paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  rechargeBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 6 },
  rechargeBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 16 },
  freeBanner: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  freeBannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
  lowBanner: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  lowBannerText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
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
  emptyTx: { padding: 20, alignItems: "center" },
  emptyTxText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  txRow: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, alignItems: "flex-end" },
  txDesc: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  txDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  rechargeModal: { padding: 28, borderTopLeftRadius: 28, borderTopRightRadius: 28, gap: 16 },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", textAlign: "right" },
  amountInput: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  amountText: { flex: 1, fontSize: 28, fontFamily: "Inter_700Bold" },
  currencyLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  quickAmounts: { flexDirection: "row", gap: 10 },
  quickAmt: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: "center" },
  quickAmtText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  modalActions: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  confirmText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
