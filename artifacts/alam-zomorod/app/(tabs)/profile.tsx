import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
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
import { STRINGS } from "@/constants/strings";
import { Badge } from "@/components/ui/Badge";
import { useData } from "@/context/DataContext";

type ActiveModal = "none" | "edit" | "phone" | "favorites" | "help" | "about" | "logout_confirm";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, updateUser } = useAuth();
  const { favorites, removeFromFavorites, providers } = useData();
  const [activeModal, setActiveModal] = useState<ActiveModal>("none");
  const [editName, setEditName] = useState(user?.name || "");
  const [newPhone, setNewPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const favProviders = providers.filter((p) => favorites.includes(p.id));

  async function handleLogoutConfirm() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveModal("none");
    await logout();
    router.replace("/login");
  }

  const menuItems = [
    { icon: "edit-2", label: STRINGS.profile.editProfile, onPress: () => { setEditName(user?.name || ""); setActiveModal("edit"); } },
    { icon: "phone", label: "تعديل رقم الهاتف", onPress: () => { setNewPhone(""); setOtpSent(false); setOtpValue(""); setOtpError(""); setPhoneSaved(false); setActiveModal("phone"); } },
    { icon: "heart", label: STRINGS.profile.favorites, onPress: () => setActiveModal("favorites") },
    {
      icon: "bell",
      label: STRINGS.profile.notifications,
      onPress: () => router.push("/(tabs)/notifications"),
    },
    { icon: "help-circle", label: STRINGS.profile.help, onPress: () => setActiveModal("help") },
    { icon: "info", label: STRINGS.profile.about, onPress: () => setActiveModal("about") },
  ];

  return (
    <>
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
              label={STRINGS.auth.asCustomer}
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
              <View style={styles.ratingRow}>
                <Feather name="heart" size={14} color="#ff6b8a" />
                <Text style={styles.statValue}> {favProviders.length}</Text>
              </View>
              <Text style={styles.statLabel}>مفضلة</Text>
            </View>
          </View>
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
          onPress={() => setActiveModal("logout_confirm")}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            {STRINGS.auth.logout}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={activeModal === "edit"} transparent animationType="slide" onRequestClose={() => setActiveModal("none")}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveModal("none")}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setActiveModal("none")}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>تعديل الملف الشخصي</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>الاسم</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
              <Feather name="user" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="اسمك الكامل"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={() => setActiveModal("none")}
            >
              <Text style={styles.saveBtnText}>حفظ التغييرات</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Phone Edit OTP Modal */}
      <Modal visible={activeModal === "phone"} transparent animationType="slide" onRequestClose={() => setActiveModal("none")}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveModal("none")}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setActiveModal("none")}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>تعديل رقم الهاتف</Text>
            </View>
            {phoneSaved ? (
              <View style={{ alignItems: "center", paddingVertical: 20, gap: 12 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#4caf50" + "20", alignItems: "center", justifyContent: "center" }}>
                  <Feather name="check-circle" size={32} color="#4caf50" />
                </View>
                <Text style={{ color: "#4caf50", fontSize: 16, fontFamily: "Inter_700Bold" }}>تم تغيير رقم الهاتف بنجاح</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>رقمك الجديد: {newPhone}</Text>
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={() => setActiveModal("none")}>
                  <Text style={styles.saveBtnText}>إغلاق</Text>
                </TouchableOpacity>
              </View>
            ) : !otpSent ? (
              <>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>رقم الهاتف الجديد</Text>
                <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Feather name="phone" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    placeholder="05XXXXXXXX"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                    textAlign="right"
                  />
                </View>
                {otpError !== "" && <Text style={{ color: colors.destructive, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular", marginBottom: 4 }}>{otpError}</Text>}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: newPhone.length >= 5 ? 1 : 0.4 }]}
                  disabled={newPhone.length < 5}
                  onPress={() => { setOtpSent(true); setOtpError(""); }}
                >
                  <Text style={styles.saveBtnText}>إرسال رمز التحقق</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={{ backgroundColor: colors.primary + "15", borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                    تم إرسال رمز التحقق إلى {newPhone}
                  </Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 }}>
                    (للتجربة: الرمز هو 1234)
                  </Text>
                </View>
                <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>رمز التحقق</Text>
                <View style={[styles.inputWrap, { borderColor: otpError ? colors.destructive : colors.border, backgroundColor: colors.muted }]}>
                  <Feather name="lock" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground, textAlign: "center", letterSpacing: 6, fontSize: 20, fontFamily: "Inter_700Bold" }]}
                    value={otpValue}
                    onChangeText={(t) => { setOtpValue(t); setOtpError(""); }}
                    placeholder="· · · ·"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={4}
                    textAlign="center"
                  />
                </View>
                {otpError !== "" && <Text style={{ color: colors.destructive, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular", marginBottom: 4 }}>{otpError}</Text>}
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary, opacity: otpValue.length === 4 ? 1 : 0.4 }]}
                  disabled={otpValue.length !== 4}
                  onPress={() => {
                    if (otpValue !== "1234") { setOtpError("رمز التحقق غير صحيح، حاولي مجدداً"); return; }
                    if (updateUser) updateUser({ phone: newPhone });
                    setPhoneSaved(true);
                  }}
                >
                  <Text style={styles.saveBtnText}>تأكيد وتغيير الرقم</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 8, alignSelf: "center" }} onPress={() => setOtpSent(false)}>
                  <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>تغيير الرقم</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Favorites Modal */}
      <Modal visible={activeModal === "favorites"} transparent animationType="slide" onRequestClose={() => setActiveModal("none")}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveModal("none")}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, styles.sheetTall, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setActiveModal("none")}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>المفضلة</Text>
            </View>
            {favProviders.length === 0 ? (
              <View style={styles.emptyFav}>
                <Feather name="heart" size={40} color={colors.border} />
                <Text style={[styles.emptyFavText, { color: colors.mutedForeground }]}>
                  لم تضيفي أي مزودة للمفضلة بعد
                </Text>
                <Text style={[styles.emptyFavSub, { color: colors.mutedForeground }]}>
                  عند تصفح المزودات، اضغطي على قلب أي مزودة لإضافتها للمفضلة
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {favProviders.map((p) => (
                  <View key={p.id} style={[styles.favRow, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                      style={[styles.favRemoveBtn, { backgroundColor: "#ff6b8a" + "20" }]}
                      onPress={() => removeFromFavorites(p.id)}
                    >
                      <Feather name="heart" size={16} color="#ff6b8a" />
                    </TouchableOpacity>
                    <View style={styles.favInfo}>
                      <Text style={[styles.favName, { color: colors.foreground }]}>{p.name}</Text>
                      <Text style={[styles.favMeta, { color: colors.mutedForeground }]}>
                        ⭐ {p.rating} · {p.totalOrders} طلب
                      </Text>
                    </View>
                    <View style={[styles.favAvatar, { backgroundColor: p.avatarColor || colors.primary }]}>
                      <Feather name="user" size={18} color="#fff" />
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Help Modal */}
      <Modal visible={activeModal === "help"} transparent animationType="slide" onRequestClose={() => setActiveModal("none")}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveModal("none")}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, styles.sheetTall, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setActiveModal("none")}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>المساعدة والدعم</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { q: "كيف أطلب خدمة؟", a: "اضغطي على \"طلب خدمة\" من الشاشة الرئيسية، واختاري التصنيف والخدمة، ثم أدخلي عنوانك وأرسلي الطلب. ستصلك عروض من المزودات القريبات منك." },
                { q: "كيف أتتبع طلبي؟", a: "يمكنك متابعة جميع طلباتك من تبويب \"طلباتي\". ستجدين حالة الطلب ويمكنك قبول أو رفض العروض المقدمة." },
                { q: "هل معلوماتي سرية؟", a: "نعم، معلوماتك الشخصية مخفية عن المزودات حتى تقبلي عرضهن. بعد القبول يتم الكشف عن بياناتك للمزودة فقط." },
                { q: "كيف أتواصل مع المزودة؟", a: "بعد قبول العرض، يظهر رقم هاتف المزودة في تفاصيل الطلب ويمكنك التواصل معها مباشرة." },
                { q: "كيف أضيف كوبون خصم؟", a: "عند طلب الخدمة، أدخلي كود الخصم في حقل \"كود الخصم\" قبل إرسال الطلب." },
              ].map((item, i) => (
                <View key={i} style={[styles.faqItem, { borderColor: colors.border }]}>
                  <Text style={[styles.faqQ, { color: colors.primary }]}>س: {item.q}</Text>
                  <Text style={[styles.faqA, { color: colors.mutedForeground }]}>ج: {item.a}</Text>
                </View>
              ))}
              <View style={[styles.contactBox, { backgroundColor: colors.primary + "10", borderColor: colors.primary + "30" }]}>
                <Feather name="mail" size={18} color={colors.primary} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.contactTitle, { color: colors.foreground }]}>تواصل معنا</Text>
                  <Text style={[styles.contactInfo, { color: colors.mutedForeground }]}>support@alamzomorod.com</Text>
                </View>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* About Modal */}
      <Modal visible={activeModal === "about"} transparent animationType="slide" onRequestClose={() => setActiveModal("none")}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveModal("none")}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setActiveModal("none")}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>عن التطبيق</Text>
            </View>
            <View style={styles.aboutLogoArea}>
              <View style={[styles.aboutLogo, { backgroundColor: colors.primary }]}>
                <Feather name="star" size={32} color="#fff" />
              </View>
              <Text style={[styles.aboutAppName, { color: colors.foreground }]}>عالم زمرد</Text>
              <Text style={[styles.aboutSlogan, { color: colors.mutedForeground }]}>جمالك في بيتك</Text>
              <View style={[styles.versionBadge, { backgroundColor: colors.muted }]}>
                <Text style={[styles.versionText, { color: colors.mutedForeground }]}>الإصدار 1.0.0</Text>
              </View>
            </View>
            <Text style={[styles.aboutDesc, { color: colors.mutedForeground }]}>
              عالم زمرد هو تطبيق متخصص في خدمات الجمال المنزلية، يربط بين العملاء ومزودات الخدمة المعتمدات في منطقتك. نحن نحرص على توفير تجربة آمنة وموثوقة لك.
            </Text>
            {[
              { icon: "shield", text: "خدمات موثوقة ومعتمدة" },
              { icon: "lock", text: "خصوصية تامة لبياناتك" },
              { icon: "star", text: "نظام تقييم شفاف" },
              { icon: "map-pin", text: "خدمة في موقعك مباشرة" },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Text style={[styles.featureText, { color: colors.foreground }]}>{f.text}</Text>
                <Feather name={f.icon as any} size={18} color={colors.primary} />
              </View>
            ))}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Logout Confirm Modal */}
      <Modal visible={activeModal === "logout_confirm"} transparent animationType="fade" onRequestClose={() => setActiveModal("none")}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setActiveModal("none")}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Feather name="log-out" size={28} color={colors.destructive} style={{ alignSelf: "center", marginBottom: 8 }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>تسجيل الخروج</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>
              هل أنت متأكدة من تسجيل الخروج من حسابك؟
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmCancel, { borderColor: colors.border }]}
                onPress={() => setActiveModal("none")}
              >
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>{STRINGS.common.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmLogout, { backgroundColor: colors.destructive }]}
                onPress={handleLogoutConfirm}
              >
                <Text style={styles.confirmLogoutText}>{STRINGS.auth.logout}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 4 },
  profileCard: { borderRadius: 20, padding: 24, alignItems: "center", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  avatarArea: { position: "relative", marginBottom: 12 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  verifiedBadge: { position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: "#4caf50", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  userName: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 4 },
  userPhone: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_400Regular", marginBottom: 10 },
  roleBadgeRow: { marginBottom: 16 },
  statsRow: { flexDirection: "row", width: "100%", justifyContent: "space-around", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 14 },
  stat: { alignItems: "center", gap: 4 },
  statValue: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: "100%", backgroundColor: "rgba(255,255,255,0.3)" },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", textAlign: "right" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 10 },
  logoutText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 34, gap: 12 },
  sheetTall: { maxHeight: "80%" },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 8 },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { padding: 16, borderRadius: 14, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  emptyFav: { alignItems: "center", paddingVertical: 40, gap: 12, paddingHorizontal: 20 },
  emptyFavText: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyFavSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  favRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  favAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  favInfo: { flex: 1, alignItems: "flex-end" },
  favName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  favMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  favRemoveBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  faqItem: { borderBottomWidth: 1, paddingBottom: 16, marginBottom: 16, gap: 6 },
  faqQ: { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  faqA: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  contactBox: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12, marginTop: 8 },
  contactTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  contactInfo: { fontSize: 13, fontFamily: "Inter_400Regular" },
  aboutLogoArea: { alignItems: "center", gap: 8, marginBottom: 8 },
  aboutLogo: { width: 72, height: 72, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  aboutAppName: { fontSize: 24, fontFamily: "Inter_700Bold" },
  aboutSlogan: { fontSize: 14, fontFamily: "Inter_400Regular" },
  versionBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 4 },
  versionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  aboutDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 22 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  featureText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  confirmBox: { margin: 20, borderRadius: 20, padding: 24, gap: 12 },
  confirmTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  confirmCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  confirmCancelText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  confirmLogout: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  confirmLogoutText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
});
