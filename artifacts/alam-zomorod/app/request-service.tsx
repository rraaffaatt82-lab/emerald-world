import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
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
  const { addRequest, validateCoupon, updateCoupon, systemSettings } = useData();
  const [step, setStep] = useState<Step>(params.serviceId ? "details" : "select-service");
  const [selectedServices, setSelectedServices] = useState<string[]>(params.serviceId ? [params.serviceId] : []);
  const [selectedCat, setSelectedCat] = useState(
    params.serviceId ? (SERVICES.find((s) => s.id === params.serviceId)?.categoryId || "") : ""
  );
  const [address, setAddress] = useState(user?.location?.address || "");
  const [notes, setNotes] = useState("");
  const [scheduleNow, setScheduleNow] = useState(true);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState("10:00");
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isWeddingRequest, setIsWeddingRequest] = useState(false);
  const [preferredTime, setPreferredTime] = useState("");

  async function detectLocation() {
    setDetectingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") { setDetectingLocation(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (geo) {
        const parts = [geo.street, geo.district, geo.city, geo.region].filter(Boolean);
        setAddress(parts.join("، ") || `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
      }
    } catch { }
    setDetectingLocation(false);
  }
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const catServices = selectedCat ? SERVICES.filter((s) => s.categoryId === selectedCat) : SERVICES;
  const dayOptions = getDayOptions();
  const selectedServiceObjects = selectedServices.map((id) => SERVICES.find((s) => s.id === id)!).filter(Boolean);
  const totalBasePrice = selectedServiceObjects.reduce((sum, s) => sum + s.basePrice, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    discountAmount = appliedCoupon.type === "percent"
      ? Math.round(totalBasePrice * appliedCoupon.value / 100)
      : Math.min(appliedCoupon.value, totalBasePrice);
  }
  const finalPrice = Math.max(0, totalBasePrice - discountAmount);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function buildScheduledAt() {
    if (scheduleNow) return new Date().toISOString();
    const d = new Date(dayOptions[selectedDayIndex].date);
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
    if (selectedServices.length === 0) return;
    if (!address.trim()) return;
    setSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((r) => setTimeout(r, 500));
    if (appliedCoupon) {
      updateCoupon(appliedCoupon.id, { usedCount: appliedCoupon.usedCount + 1 });
    }
    const scheduledAt = buildScheduledAt();
    const perServiceDiscount = selectedServices.length > 1 ? Math.floor(discountAmount / selectedServices.length) : discountAmount;
    selectedServiceObjects.forEach((svc, idx) => {
      const category = CATEGORIES.find((c) => c.id === svc.categoryId)!;
      const svcDiscount = idx === 0 ? discountAmount - perServiceDiscount * (selectedServices.length - 1) : perServiceDiscount;
      addRequest({
        customerId: user?.id || "1",
        customerName: user?.name || "عميل",
        customerPhone: user?.phone,
        serviceId: svc.id,
        serviceName: svc.name,
        categoryName: category.name,
        status: "pending",
        address: address.trim(),
        scheduledAt,
        scheduledLater: !scheduleNow,
        notes: notes.trim() || undefined,
        price: Math.max(0, svc.basePrice - svcDiscount + (isUrgent ? systemSettings.urgentFeeAmount : 0)),
        radiusKm: 10,
        couponCode: appliedCoupon?.code || undefined,
        isUrgent,
        urgentFee: isUrgent ? systemSettings.urgentFeeAmount : undefined,
        isWeddingRequest: isWeddingRequest || undefined,
        preferredTime: preferredTime.trim() || undefined,
      });
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
            {step === "select-service" ? "اختاري الخدمات" : "تفاصيل الطلب"}
          </Text>
          {step === "details" ? (
            <TouchableOpacity onPress={() => setStep("select-service")} style={styles.closeBtn}>
              <Feather name="plus-circle" size={22} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {step === "select-service" ? (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {selectedServices.length > 0 && (
              <View style={[styles.selectedBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary + "30" }]}>
                <Feather name="check-circle" size={16} color={colors.primary} />
                <Text style={[styles.selectedBannerText, { color: colors.primary }]}>
                  تم اختيار {selectedServices.length} {selectedServices.length === 1 ? "خدمة" : "خدمات"}
                </Text>
              </View>
            )}

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>اختاري التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
              <TouchableOpacity
                style={[styles.catChip, { backgroundColor: selectedCat === "" ? colors.primary : colors.muted, borderColor: selectedCat === "" ? colors.primary : colors.border }]}
                onPress={() => setSelectedCat("")}
              >
                <Text style={[styles.catChipText, { color: selectedCat === "" ? "#fff" : colors.foreground }]}>الكل</Text>
              </TouchableOpacity>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catChip, { backgroundColor: selectedCat === cat.id ? colors.primary : colors.muted, borderColor: selectedCat === cat.id ? colors.primary : colors.border }]}
                  onPress={() => setSelectedCat(cat.id)}
                >
                  <Feather name={cat.icon as any} size={14} color={selectedCat === cat.id ? "#fff" : colors.mutedForeground} />
                  <Text style={[styles.catChipText, { color: selectedCat === cat.id ? "#fff" : colors.foreground }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
              الخدمات المتاحة — اختاري خدمة أو أكثر
            </Text>
            <View style={styles.serviceGrid}>
              {catServices.map((svc) => {
                const isSelected = selectedServices.includes(svc.id);
                return (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.serviceCard, { backgroundColor: isSelected ? colors.primary + "12" : colors.card, borderColor: isSelected ? colors.primary : colors.border }]}
                    onPress={() => toggleService(svc.id)}
                  >
                    {isSelected && (
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
                      <Text style={[styles.svcPrice, { color: colors.primary }]}>من {svc.basePrice} د.أ</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.primary }, selectedServices.length === 0 && { opacity: 0.45 }]}
              onPress={() => selectedServices.length > 0 && setStep("details")}
              disabled={selectedServices.length === 0}
            >
              <Text style={styles.nextBtnText}>
                التالي {selectedServices.length > 0 ? `(${selectedServices.length} خدمات)` : ""}
              </Text>
              <Feather name="arrow-left" size={18} color="#fff" />
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.selectedServicesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.selectedServicesHeader}>
                <TouchableOpacity onPress={() => setStep("select-service")}>
                  <Text style={[styles.changeLink, { color: colors.accent }]}>تغيير</Text>
                </TouchableOpacity>
                <Text style={[styles.selectedServicesTitle, { color: colors.foreground }]}>
                  الخدمات المختارة ({selectedServices.length})
                </Text>
              </View>
              {selectedServiceObjects.map((svc, i) => (
                <View key={svc.id} style={[styles.selectedSvcRow, i < selectedServiceObjects.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                  <Text style={[styles.selectedSvcPrice, { color: colors.primary }]}>{svc.basePrice} د.أ</Text>
                  <View style={styles.selectedSvcInfo}>
                    <Text style={[styles.selectedSvcName, { color: colors.foreground }]}>{svc.name}</Text>
                    <Text style={[styles.selectedSvcCat, { color: colors.mutedForeground }]}>
                      {CATEGORIES.find((c) => c.id === svc.categoryId)?.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      const updated = selectedServices.filter((id) => id !== svc.id);
                      setSelectedServices(updated);
                      if (updated.length === 0) setStep("select-service");
                    }}
                    style={[styles.removeSvcBtn, { backgroundColor: colors.destructive + "15" }]}
                  >
                    <Feather name="x" size={14} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={[styles.addMoreBtn, { borderColor: colors.primary + "50" }]}
                onPress={() => setStep("select-service")}
              >
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={[styles.addMoreText, { color: colors.primary }]}>إضافة خدمة أخرى</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <TouchableOpacity
                style={[styles.gpsBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "40" }]}
                onPress={detectLocation}
                disabled={detectingLocation}
              >
                <Feather name="navigation" size={14} color={colors.primary} />
                <Text style={[styles.gpsBtnText, { color: colors.primary }]}>
                  {detectingLocation ? "جارٍ التحديد..." : "اكتشاف موقعي"}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.fieldLabel, { color: colors.foreground, marginBottom: 0 }]}>عنوانك</Text>
            </View>
            <View style={[styles.inputWrap, { borderColor: address ? colors.primary : colors.border, backgroundColor: colors.muted }]}>
              <Feather name="map-pin" size={18} color={address ? colors.primary : colors.mutedForeground} />
              <TextInput
                style={[styles.fieldInput, { color: colors.foreground }]}
                value={address}
                onChangeText={setAddress}
                placeholder="أدخلي عنوانك أو اضغطي اكتشاف موقعي"
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

            <TouchableOpacity
              style={[styles.urgentToggle, { backgroundColor: isUrgent ? "#ff5722" + "15" : colors.muted, borderColor: isUrgent ? "#ff5722" : colors.border }]}
              onPress={() => setIsUrgent((v) => !v)}
            >
              <View style={styles.urgentRight}>
                <Text style={[styles.urgentLabel, { color: isUrgent ? "#ff5722" : colors.foreground }]}>⚡ طلب عاجل</Text>
                <Text style={[styles.urgentDesc, { color: colors.mutedForeground }]}>
                  {isUrgent ? `سيُضاف ${systemSettings.urgentFeeAmount} د.أ رسوم أولوية — يُرسَل الطلب للمتاحات فوراً` : "يضمن وصول مزودة خدمة في أقل وقت ممكن"}
                </Text>
              </View>
              <View style={[styles.urgentToggleBtn, { backgroundColor: isUrgent ? "#ff5722" : colors.border }]}>
                <View style={[styles.urgentToggleKnob, { transform: [{ translateX: isUrgent ? 16 : 0 }] }]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.urgentToggle, { backgroundColor: isWeddingRequest ? "#9c27b0" + "15" : colors.muted, borderColor: isWeddingRequest ? "#9c27b0" : colors.border }]}
              onPress={() => setIsWeddingRequest((v) => !v)}
            >
              <View style={styles.urgentRight}>
                <Text style={[styles.urgentLabel, { color: isWeddingRequest ? "#9c27b0" : colors.foreground }]}>💍 طلب زفاف أو مناسبة</Text>
                <Text style={[styles.urgentDesc, { color: colors.mutedForeground }]}>
                  {isWeddingRequest ? "سيتم إعلام المزودات المتخصصات بالمناسبات" : "للأعراس والمناسبات الكبيرة — تواصلي مع متخصصات"}
                </Text>
              </View>
              <View style={[styles.urgentToggleBtn, { backgroundColor: isWeddingRequest ? "#9c27b0" : colors.border }]}>
                <View style={[styles.urgentToggleKnob, { transform: [{ translateX: isWeddingRequest ? 16 : 0 }] }]} />
              </View>
            </TouchableOpacity>

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>وقت مفضل للتنفيذ (اختياري)</Text>
            <View style={[styles.couponInputWrap, { backgroundColor: colors.muted, borderColor: colors.border, marginBottom: 4 }]}>
              <Feather name="clock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.couponInput, { color: colors.foreground }]}
                value={preferredTime}
                onChangeText={setPreferredTime}
                placeholder="مثال: بعد الساعة ٣ عصراً..."
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>

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
            {couponError !== "" && <Text style={[styles.couponError, { color: colors.destructive }]}>{couponError}</Text>}
            {appliedCoupon && (
              <View style={[styles.couponSuccess, { backgroundColor: colors.success + "15", borderColor: colors.success + "30" }]}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.couponSuccessText, { color: colors.success }]}>
                  تم تطبيق كوبون {appliedCoupon.code} — خصم {appliedCoupon.type === "percent" ? `${appliedCoupon.value}%` : `${appliedCoupon.value} د.أ`}
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

            <View style={[styles.priceSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {selectedServiceObjects.map((svc) => (
                <View key={svc.id} style={styles.priceRow}>
                  <Text style={[styles.priceValue, { color: colors.foreground }]}>{svc.basePrice} د.أ</Text>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{svc.name}</Text>
                </View>
              ))}
              {isUrgent && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceValue, { color: "#ff5722" }]}>+ {systemSettings.urgentFeeAmount} د.أ</Text>
                  <Text style={[styles.priceLabel, { color: "#ff5722" }]}>⚡ رسوم أولوية عاجل</Text>
                </View>
              )}
              {appliedCoupon && (
                <View style={styles.priceRow}>
                  <Text style={[styles.priceValue, { color: colors.destructive }]}>- {discountAmount} د.أ</Text>
                  <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>الخصم</Text>
                </View>
              )}
              <View style={[styles.priceDivider, { backgroundColor: colors.border }]} />
              <View style={styles.priceRow}>
                <Text style={[styles.priceFinal, { color: colors.primary }]}>{finalPrice + (isUrgent ? systemSettings.urgentFeeAmount : 0)} د.أ</Text>
                <Text style={[styles.priceFinalLabel, { color: colors.foreground }]}>الإجمالي</Text>
              </View>
            </View>

            <View style={[styles.privacyBox, { backgroundColor: colors.accent + "10", borderColor: colors.accent + "30" }]}>
              <Feather name="shield" size={16} color={colors.accent} />
              <Text style={[styles.privacyText, { color: colors.accent }]}>
                معلوماتك مخفية حتى تقبلي عرض مزودة الخدمة
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }, (submitting || selectedServices.length === 0 || !address.trim()) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting || selectedServices.length === 0 || !address.trim()}
            >
              <Feather name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {submitting ? "جارٍ الإرسال..." : `إرسال ${selectedServices.length > 1 ? `${selectedServices.length} طلبات` : "الطلب"}`}
              </Text>
            </TouchableOpacity>

            <View style={styles.afterSubmitNote}>
              <Feather name="bell" size={14} color={colors.mutedForeground} />
              <Text style={[styles.afterSubmitText, { color: colors.mutedForeground }]}>
                بعد الإرسال ستجدين طلباتك في صفحة "طلباتي" وتستطيعين متابعة العروض من هناك
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
  selectedBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, borderWidth: 1 },
  selectedBannerText: { fontSize: 14, fontFamily: "Inter_700Bold" },
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
  selectedServicesCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  selectedServicesHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 14, paddingBottom: 10 },
  selectedServicesTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  changeLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
  selectedSvcRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10 },
  selectedSvcInfo: { flex: 1, alignItems: "flex-end" },
  selectedSvcName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  selectedSvcCat: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  selectedSvcPrice: { fontSize: 13, fontFamily: "Inter_700Bold", minWidth: 60, textAlign: "left" },
  removeSvcBtn: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  addMoreBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, borderTopWidth: 1, gap: 8 },
  addMoreText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  gpsBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  gpsBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
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
  urgentToggle: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 12 },
  urgentRight: { flex: 1, alignItems: "flex-end", gap: 3 },
  urgentLabel: { fontSize: 15, fontFamily: "Inter_700Bold" },
  urgentDesc: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  urgentToggleBtn: { width: 36, height: 20, borderRadius: 10, padding: 2 },
  urgentToggleKnob: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff" },
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
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 16, gap: 10 },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  afterSubmitNote: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  afterSubmitText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 18 },
});
