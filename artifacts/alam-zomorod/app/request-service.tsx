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

const DATE_OPTIONS = ["الآن", "غداً صباحاً", "غداً مساءً", "اختار موعد لاحق"];

export default function RequestServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const { user } = useAuth();
  const { addRequest } = useData();
  const [step, setStep] = useState<Step>(params.serviceId ? "details" : "select-service");
  const [selectedService, setSelectedService] = useState(params.serviceId || "");
  const [selectedCat, setSelectedCat] = useState(
    params.serviceId ? (SERVICES.find((s) => s.id === params.serviceId)?.categoryId || "") : ""
  );
  const [address, setAddress] = useState(user?.location?.address || "");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("الآن");
  const [submitting, setSubmitting] = useState(false);
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  const service = SERVICES.find((s) => s.id === selectedService);
  const catServices = selectedCat ? SERVICES.filter((s) => s.categoryId === selectedCat) : SERVICES;

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
    addRequest({
      customerId: user?.id || "1",
      customerName: user?.name || "عميل",
      customerPhone: user?.phone,
      serviceId: svc.id,
      serviceName: svc.name,
      categoryName: category.name,
      status: "pending",
      address: address.trim(),
      scheduledAt: new Date().toISOString(),
      notes: notes.trim() || undefined,
      price: svc.basePrice,
      radiusKm: 10,
    });
    setSubmitting(false);
    router.dismiss();
    setTimeout(() => {
      router.push("/(tabs)/orders");
    }, 100);
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
                  <Feather
                    name={cat.icon as any}
                    size={14}
                    color={selectedCat === cat.id ? "#fff" : colors.mutedForeground}
                  />
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
              style={[
                styles.nextBtn,
                { backgroundColor: colors.primary },
                !selectedService && { opacity: 0.45 },
              ]}
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
            <View style={styles.dateOptions}>
              {DATE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: scheduledAt === opt ? colors.primary : colors.muted,
                      borderColor: scheduledAt === opt ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setScheduledAt(opt)}
                >
                  <Text style={[styles.dateChipText, { color: scheduledAt === opt ? "#fff" : colors.foreground }]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

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
  catChip: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, gap: 6,
  },
  catChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  serviceGrid: { gap: 10 },
  serviceCard: {
    borderRadius: 16, borderWidth: 1.5, padding: 14, position: "relative",
  },
  selectedCheck: {
    position: "absolute", top: 12, left: 12, width: 22, height: 22,
    borderRadius: 11, alignItems: "center", justifyContent: "center",
  },
  svcName: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 4 },
  svcDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", marginBottom: 8 },
  svcMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  svcMetaItem: { flexDirection: "row", alignItems: "center" },
  svcMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  svcPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  nextBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, borderRadius: 16, gap: 10, marginTop: 4,
  },
  nextBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  selectedServiceBanner: {
    flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14,
    borderWidth: 1, gap: 12,
  },
  selectedServiceName: { fontSize: 15, fontFamily: "Inter_700Bold" },
  selectedServicePrice: { fontSize: 13, fontFamily: "Inter_400Regular" },
  changeLink: { fontSize: 14, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", marginBottom: -6 },
  inputWrap: {
    flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  fieldInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dateOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5 },
  dateChipText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  notesInput: { borderRadius: 14, borderWidth: 1, padding: 14, fontSize: 14, fontFamily: "Inter_400Regular", minHeight: 80 },
  privacyBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 10 },
  privacyText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    padding: 16, borderRadius: 16, gap: 10,
    shadowColor: "#c2185b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  afterSubmitNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, justifyContent: "flex-end" },
  afterSubmitText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", flex: 1, lineHeight: 18 },
});
