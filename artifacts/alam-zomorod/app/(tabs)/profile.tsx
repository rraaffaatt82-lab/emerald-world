import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
import { STRINGS } from "@/constants/strings";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { walletTransactions } = useData();
  const [showRecharge, setShowRecharge] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل أنت متأكد من تسجيل الخروج؟", [
      { text: STRINGS.common.cancel, style: "cancel" },
      {
        text: STRINGS.auth.logout,
        style: "destructive",
        onPress: async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  function handleRecharge() {
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("خطأ", "يرجى إدخال مبلغ صحيح");
      return;
    }
    updateUser({ walletBalance: (user?.walletBalance || 0) + amount });
    setShowRecharge(false);
    setRechargeAmount("");
    Alert.alert("تم", `تم شحن ${amount} ريال بنجاح`);
  }

  const menuItems = [
    { icon: "edit-2", label: STRINGS.profile.editProfile, onPress: () => {} },
    { icon: "heart", label: STRINGS.profile.favorites, onPress: () => {} },
    { icon: "bell", label: STRINGS.profile.notifications, onPress: () => {} },
    { icon: "help-circle", label: STRINGS.profile.help, onPress: () => {} },
    { icon: "info", label: STRINGS.profile.about, onPress: () => {} },
  ];

  if (user?.role === "provider") {
    menuItems.splice(1, 0, {
      icon: "briefcase",
      label: STRINGS.provider.incomingRequests,
      onPress: () => {},
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + webTopPad + 10,
          paddingBottom: insets.bottom + webBottomPad + 90,
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>
        {STRINGS.profile.title}
      </Text>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.primary, shadowColor: colors.primary },
        ]}
      >
        <View style={styles.avatarArea}>
          <View style={styles.avatar}>
            <Feather name="user" size={36} color={colors.primary} />
          </View>
          {user?.isVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="check" size={10} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userPhone}>{user?.phone}</Text>
        <View style={styles.roleBadgeRow}>
          <Badge
            label={
              user?.role === "customer"
                ? STRINGS.auth.asCustomer
                : user?.providerType === "salon"
                ? STRINGS.auth.salon
                : STRINGS.auth.freelancer
            }
            variant="outline"
            style={{ borderColor: "rgba(255,255,255,0.5)" }}
          />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{user?.totalOrders || 0}</Text>
            <Text style={styles.statLabel}>{STRINGS.profile.totalOrders}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <View style={styles.ratingRow}>
              <Feather name="star" size={14} color="#ffd700" />
              <Text style={styles.statValue}> {user?.rating || 0}</Text>
            </View>
            <Text style={styles.statLabel}>{STRINGS.profile.rating}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {user?.walletBalance || 0} {STRINGS.common.sar}
            </Text>
            <Text style={styles.statLabel}>{STRINGS.profile.balance}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.walletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.walletHeader}>
          <TouchableOpacity
            style={[styles.rechargeBtn, { backgroundColor: colors.primary }]}
            onPress={() => setShowRecharge(true)}
          >
            <Feather name="plus" size={16} color="#fff" />
            <Text style={styles.rechargeBtnText}>{STRINGS.profile.recharge}</Text>
          </TouchableOpacity>
          <Text style={[styles.walletTitle, { color: colors.foreground }]}>
            {STRINGS.profile.wallet}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.historyTitle, { color: colors.foreground }]}>
          {STRINGS.profile.history}
        </Text>
        {walletTransactions.slice(0, 4).map((t) => (
          <View key={t.id} style={styles.transRow}>
            <Text
              style={[
                styles.transAmount,
                { color: t.type === "credit" ? colors.success : colors.destructive },
              ]}
            >
              {t.type === "credit" ? "+" : "-"}
              {t.amount} {STRINGS.common.sar}
            </Text>
            <View>
              <Text
                style={[styles.transDesc, { color: colors.foreground }]}
                numberOfLines={1}
              >
                {t.description}
              </Text>
              <Text style={[styles.transDate, { color: colors.mutedForeground }]}>
                {t.date}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.menuItem,
              i < menuItems.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
            onPress={item.onPress}
          >
            <Feather name="chevron-left" size={18} color={colors.mutedForeground} />
            <Text style={[styles.menuLabel, { color: colors.foreground }]}>
              {item.label}
            </Text>
            <Feather name={item.icon as any} size={20} color={colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.destructive }]}
        onPress={handleLogout}
      >
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>
          {STRINGS.auth.logout}
        </Text>
      </TouchableOpacity>

      <Modal visible={showRecharge} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.rechargeModal, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {STRINGS.profile.recharge}
            </Text>
            <View
              style={[
                styles.amountInput,
                { backgroundColor: colors.muted, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.currencyLabel, { color: colors.mutedForeground }]}>
                {STRINGS.common.sar}
              </Text>
              <TextInput
                style={[styles.amountText, { color: colors.foreground }]}
                value={rechargeAmount}
                onChangeText={setRechargeAmount}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
                autoFocus
              />
            </View>
            <View style={styles.quickAmounts}>
              {[50, 100, 200, 500].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.quickAmt, { borderColor: colors.primary + "50" }]}
                  onPress={() => setRechargeAmount(amt.toString())}
                >
                  <Text style={[styles.quickAmtText, { color: colors.primary }]}>
                    {amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setShowRecharge(false)}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                  {STRINGS.common.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: colors.primary }]}
                onPress={handleRecharge}
              >
                <Text style={styles.confirmText}>{STRINGS.common.confirm}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 4,
  },
  profileCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarArea: { position: "relative", marginBottom: 12 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4caf50",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    color: "#fff",
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  userPhone: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 10,
  },
  roleBadgeRow: { marginBottom: 16 },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 14,
  },
  stat: { alignItems: "center", gap: 4 },
  statValue: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  walletCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  walletHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  walletTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  rechargeBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  rechargeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  divider: { height: 1, marginBottom: 12 },
  historyTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
    textAlign: "right",
  },
  transRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  transAmount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  transDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  transDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  menuCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "right",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  logoutText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  rechargeModal: {
    padding: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currencyLabel: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginStart: 8,
  },
  amountText: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  quickAmounts: {
    flexDirection: "row",
    gap: 10,
  },
  quickAmt: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  quickAmtText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
