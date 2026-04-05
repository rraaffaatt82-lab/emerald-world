import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
import { useData, SERVICES, CATEGORIES } from "@/context/DataContext";

type Step = "select-service" | "details";

const HOURS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

function getDayOptions() {
  const today = new Date();
  const result = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = i === 0 ? "اليوم" : i === 1 ? "غداً" : d.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric", month: "short" });
    result.push({ label, date: d });
  }
  return result;
}

export default function RequestServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const { user } = useAuth();
  const { addRequest, validateCoupon, updateCoupon } = useData();
  const [step, setStep] = useState<Step>(params.serviceId ? "details" : "select-service");
  const [selectedService, setSelectedService] = useState(params.serviceId || "");
  const [selectedCat, setSelectedCat] = useState(
    params.serviceId ? (SERVICES.find((s) => s.id === params.serviceId)?.categoryId || "") : ""
  );
  const [address, setAddress] = useState(user?.location?.address || "");
  const [notes, setNotes] = useState("");
  const [scheduleNow, setScheduleNow] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const service = SERVICES.find((s) => s.id === selectedService);
  const catServices = selectedCat ? SERVICES.filter((s) => s.categoryId === selectedCat) : SERVICES;
  const dayOptions = getDayOptions();

  const originalPrice = service?.basePrice || 0;
  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === "percent"
      ? Math.round(originalPrice * appliedCoupon.value / 100)
      : Math.min(appliedCoupon.value, originalPrice);
  }
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  function buildScheduledAt() {
    if (scheduleNow) return new Date().toISOString();
    const d = dayOptions[selectedDayIndex].date;
    const [h, m] = selectedHour.split(":");
    d.setHours(parseInt(h), parseInt(m), 0, 0);
    return d.toISOString();
  }

  function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    const coupon = validateCoupon(couponCode);
    if (!coupon) {
      setCouponError("الكوبون غير صالح أو منتهي");
      setAppliedCoupon(null);
    } else {
      setAppliedCoupon(coupon);
      setCouponError("");
    }
  }

  async function handleSubmit() {
    if (!selectedService) {
      Alert.alert("تنبيه", "يرجى اختيار الخدمة أولاً");
      return;
    }
    if (!address.trim()) {
      Alert.alert("تنبيه", "يرجى إدخال عنوانك");
      return;
    }
    const svc = SERVICES.find((s) => s.id === selectedService)!;
    const category = CATEGORIES.find((c) => c.id === svc.categoryId)!;
    setSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 500));
    if (appliedCoupon) {
      updateCoupon(appliedCoupon.id, { usedCount: appliedCoupon.usedCount + 1 });
    }
    addRequest({
      customerId: user?.id || "1",
      customerName: user?.name || "عميل",
      customerPhone: user?.phone,
      serviceId: svc.id,
      serviceName: svc.name,
      categoryName: category.name,
      status: "pending",
      address: address.trim(),
      scheduledAt: buildScheduledAt(),
      scheduledLater: !scheduleNow,
      notes: notes.trim() || undefined,
      price: finalPrice,
      radiusKm: 10,
      couponCode: appliedCoupon?.code || undefined,
    });
    setSubmitting(false);
    router.dismiss();
    setTimeout(() => router.push("/(tabs)/orders"), 100);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: insets.top + webTopPad + 12, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.dismiss()} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {step === "select-service" ? "اختاري الخدمة" : "تفاصيل الطلب"}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {step === "select-service" ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>اختاري التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: selectedCat === cat.id ? colors.primary : colors.muted,
                      borderColor: selectedCat === cat.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => { setSelectedCat(cat.id); setSelectedService(""); }}
                >
                  <Feather name={cat.icon as any} size={14} color={selectedCat === cat.id ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: selectedCat === cat.id ? "#fff" : colors.foreground }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>الخدمات المتاحة</Text>
            <View style={styles.serviceGrid}>
              {catServices.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: selectedService === svc.id ? colors.primary + "12" : colors.card,
                      borderColor: selectedService === svc.id ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedService(svc.id)}
                >
                  {selectedService === svc.id && (
                    <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                  <Text style={[styles.svcName, { color: colors.foreground }]}>{svc.name}</Text>
                  <Text style={[styles.svcDesc, { color: colors.mutedForeground }]}>{svc.description}</Text>
                  <View style={styles.svcMeta}>
                    <View style={styles.svcMetaItem}>
                      <Feather name="clock" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.svcMetaText, { color: colors.mutedForeground }]}> {svc.duration} دقيقة</Text>
                    </View>
                    <Text style={[styles.svcPrice, { color: colors.primary }]}>من {svc.basePrice} ر.س</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }, !selectedService && { opacity: 0.45 }]}
              onPress={() => selectedService && setStep("details")}
              disabled={!selectedService}
            >
              <Text style={styles.nextBtnText}>التالي</Text>
              <Feather name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {service && (
              <View style={[styles.selectedServiceBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Feather name="check-circle" size={18} color={colors.primary} />
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.selectedServiceName, { color: colors.primary }]}>{service.name}</Text>
                  <Text style={[styles.selectedServicePrice, { color: colors.mutedForeground }]}>
                    السعر المبدئي: {service.basePrice} ر.س
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setStep("select-service")}>
                  <Text style={[styles.changeLink, { color: colors.accent }]}>تغيير</Text>
                </TouchableOpacity>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>عنوانك</Text>
            <View style={[styles.inputWrap, { borderColor: address ? colors.primary : colors.border, backgroundColor: colors.muted }]}>
              <Feather name="map-pin" size={18} color={address ? colors.primary : colors.mutedForeground} />
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                value={address}
                onChangeText={setAddress}
                placeholder="أدخلي عنوانك بالتفصيل"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>الموعد المطلوب</Text>
            <View style={styles.scheduleToggleRow}>
              <TouchableOpacity
                style={[styles.scheduleToggleBtn, { backgroundColor: scheduleNow ? colors.primary : colors.muted, borderColor: scheduleNow ? colors.primary : colors.border }]}
                onPress={() => setScheduleNow(true)}
              >
                <Feather name="zap" size={14} color={scheduleNow ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.scheduleToggleText, { color: scheduleNow ? "#fff" : colors.foreground }]}>الآن</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.scheduleToggleBtn, { backgroundColor: !scheduleNow ? colors.primary : colors.muted, borderColor: !scheduleNow ? colors.primary : colors.border }]}
                onPress={() => setScheduleNow(false)}
              >
                <Feather name="calendar" size={14} color={!scheduleNow ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.scheduleToggleText, { color: !scheduleNow ? "#fff" : colors.foreground }]}>تحديد موعد</Text>
              </TouchableOpacity>
            </View>

            {!scheduleNow && (
              <View style={styles.datePickerArea}>
                <Text style={[styles.datePickerLabel, { color: colors.mutedForeground }]}>اليوم</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {dayOptions.map((d, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.dayChip, { backgroundColor: selectedDayIndex === i ? colors.primary : colors.muted, borderColor: selectedDayIndex === i ? colors.primary : colors.border }]}
                      onPress={() => setSelectedDayIndex(i)}
                    >
                      <Text style={[styles.dayChipText, { color: selectedDayIndex === i ? "#fff" : colors.foreground }]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={[styles.datePickerLabel, { color: colors.mutedForeground }]}>الوقت</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                  {HOURS.map((h) => (
                    <TouchableOpacity
                      key={h}
                      style={[styles.hourChip, { backgroundColor: selectedHour === h ? colors.primary : colors.muted, borderColor: selectedHour === h ? colors.primary : colors.border }]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.hourChipText, { color: selectedHour === h ? "#fff" : colors.foreground }]}>{h}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={[styles.selectedDateDisplay, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                  <Feather name="clock" size={14} color={colors.primary} />
                  <Text style={[styles.selectedDateText, { color: colors.primary }]}>
                    {dayOptions[selectedDayIndex].label} الساعة {selectedHour}
                  </Text>
                </View>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>كود الخصم (اختياري)</Text>
            <View style={styles.couponRow}>
              <TouchableOpacity
                style={[styles.couponApplyBtn, { backgroundColor: appliedCoupon ? colors.success : colors.primary }]}
                onPress={handleApplyCoupon}
              >
                <Text style={styles.couponApplyText}>{appliedCoupon ? "✓" : "تطبيق"}</Text>
              </TouchableOpacity>
              <View style={[styles.couponInputWrap, { backgroundColor: colors.muted, borderColor: appliedCoupon ? colors.success : couponError ? colors.destructive : colors.border }]}>
                <Feather name="tag" size={16} color={appliedCoupon ? colors.success : colors.mutedForeground} />
                <TextInput
                  style={[styles.couponInput, { color: colors.foreground }]}
                  value={couponCode}
                  onChangeText={(t) => { setCouponCode(t); setCouponError(""); if (!t) setAppliedCoupon(null); }}
                  placeholder="أدخلي كود الخصم"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  textAlign="right"
                />
              </View>
            </View>
            {couponError && <Text style={[styles.couponError, { color: colors.destructive }]}>{couponError}</Text>}
            {appliedCoupon && (
              <View style={[styles.couponSuccess, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.couponSuccessText, { color: colors.success }]}>
                  تم تطبيق كوبون {appliedCoupon.code} — خصم {appliedCoupon.type === "percent" ? `${appliedCoupon.value}%` : `${appliedCoupon.value} ر.س`}
                </Text>
              </View>
            )}

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ملاحظات (اختياري)</Text>
            <TextInput
              style={[styles.notesInput, { borderColor: colors.border, backgroundColor: colors.muted, color: colors.foreground }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="أضيفي أي تفاصيل تساعد مزودة الخدمة..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlign="right"
              textAlignVertical="top"
            />

            {appliedCoupon && (
              <View style={[styles.priceSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceValue, { color: colors.foreground }]}>{originalPrice} ر.س</Text>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>السعر الأصلي</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={[styles.priceValue, { color: colors.destructive }]}>- {discountAmount} ر.س</Text>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>الخصم</Text>
                </View>
                <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
                <View style={styles.priceRow}>
                  <Text style={[styles.priceFinal, { color: colors.primary }]}>{finalPrice} ر.س</Text>
                  <Text style={[styles.priceFinalLabel, { color: colors.foreground }]}>الإجمالي</Text>
                </View>
              </View>
            )}

            <View style={[styles.privacyBox, { backgroundColor: colors.accent + "10", borderColor: colors.accent + "30" }]}>
              <Feather name="shield" size={16} color={colors.accent} />
              <Text style={[styles.privacyText, { color: colors.accent }]}>
                معلوماتك مخفية حتى تقبلي عرض مزودة الخدمة
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>{submitting ? "جارٍ الإرسال..." : "إرسال الطلب"}</Text>
            </TouchableOpacity>

            <View style={styles.afterSubmitNote}>
              <Feather name="bell" size={14} color={colors.mutedForeground} />
              <Text style={[styles.afterSubmitText, { color: colors.mutedForeground }]}>
                بعد الإرسال ستجدين طلبك في صفحة "طلباتي" وتستطيعين متابعة العروض من هناك
              </Text>
            </View>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  scrollContent: { padding: 20, paddingBottom: 40, gap: 14 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", marginBottom: -6 },
  catRow: { paddingVertical: 4, gap: 8 },
  catChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  catChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  serviceGrid: { gap: 10 },
  serviceCard: { borderRadius: 16, borderWidth: 1.5, padding: 14, position: "relative" },
  selectedCheck: { position: "absolute", top: 12, left: 12, width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  svcName: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 4 },
  svcDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", marginBottom: 8 },
  svcMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  svcMetaItem: { flexDirection: "row", alignItems: "center" },
  svcMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  svcPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  nextBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 16, gap: 10, marginTop: 4 },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  selectedServiceBanner: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  selectedServiceName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  selectedServicePrice: { fontSize: 13, fontFamily: "Inter_400Regular" },
  changeLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", marginBottom: -6 },
  inputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  fieldInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  scheduleToggleRow: { flexDirection: "row", gap: 10 },
  scheduleToggleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 14, borderWidth: 1.5, gap: 8 },
  scheduleToggleText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  datePickerArea: { gap: 8, padding: 14, backgroundColor: "rgba(0,0,0,0.03)", borderRadius: 16 },
  datePickerLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  dayChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5 },
  dayChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  hourChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, minWidth: 64, alignItems: "center" },
  hourChipText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  selectedDateDisplay: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  selectedDateText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  couponRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  couponInputWrap: { flex: 1, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  couponInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  couponApplyBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  couponApplyText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  couponError: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  couponSuccess: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderRadius: 10, borderWidth: 1 },
  couponSuccessText: { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1, textAlign: "right" },
  priceSummary: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 10 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  priceValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  priceDivider: { height: 1 },
  priceFinalLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  priceFinal: { fontSize: 20, fontFamily: "Inter_700Bold" },
  notesInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  privacyBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
  privacyText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 16, gap: 10, shadowColor: "#c2185b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  afterSubmitNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, justifyContent: "flex-end" },
  afterSubmitText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", flex: 1, lineHeight: 18 },
});
