import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { STRINGS } from "@/constants/strings";
import { ProviderCard } from "@/components/ui/ProviderCard";

type Step = "select-service" | "details" | "waiting" | "offers";

export default function RequestServiceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ serviceId?: string }>();
  const { user } = useAuth();
  const { addOrder, orders, acceptOffer } = useData();
  const [step, setStep] = useState<Step>(params.serviceId ? "details" : "select-service");
  const [selectedService, setSelectedService] = useState(
    params.serviceId || ""
  );
  const [selectedCat, setSelectedCat] = useState("");
  const [address, setAddress] = useState(user?.location?.address || "");
  const [notes, setNotes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("الآن");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (params.serviceId) {
      const s = SERVICES.find((s) => s.id === params.serviceId);
      if (s) setSelectedCat(s.categoryId);
    }
  }, [params.serviceId]);

  const currentOrder = orderId ? orders.find((o) => o.id === orderId) : null;

  function handleSubmit() {
    if (!selectedService || !address) {
      Alert.alert("خطأ", "يرجى تحديد الخدمة والموقع");
      return;
    }
    const service = SERVICES.find((s) => s.id === selectedService)!;
    const category = CATEGORIES.find((c) => c.id === service.categoryId)!;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newId = "o" + Date.now();
    addOrder({
      customerId: user?.id || "1",
      serviceId: service.id,
      serviceName: service.name,
      categoryName: category.name,
      status: "pending",
      address,
      scheduledAt: new Date().toISOString(),
      notes,
      price: service.basePrice,
    });
    setOrderId(newId);
    setStep("waiting");
  }

  useEffect(() => {
    if (step === "waiting" && currentOrder?.status === "offers_received") {
      setStep("offers");
    }
  }, [currentOrder?.status, step]);

  function handleAcceptOffer(offerId: string) {
    if (!orderId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    acceptOffer(orderId, offerId);
    Alert.alert("تم قبول العرض!", "سيتواصل معك مزود الخدمة قريباً", [
      { text: "رائع", onPress: () => router.replace("/(tabs)/orders") },
    ]);
  }

  const service = SERVICES.find((s) => s.id === selectedService);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 10,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 30,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {STRINGS.request.title}
          </Text>
        </View>

        <View style={styles.stepsRow}>
          {["select-service", "details", "waiting", "offers"].map((s, i) => (
            <View
              key={s}
              style={[
                styles.stepDot,
                {
                  backgroundColor:
                    step === s
                      ? colors.primary
                      : ["select-service", "details", "waiting", "offers"].indexOf(step) >
                        i
                      ? colors.success
                      : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {step === "select-service" && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              {STRINGS.request.selectService}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.catChip,
                    {
                      borderColor: selectedCat === c.id ? c.color : colors.border,
                      backgroundColor: selectedCat === c.id ? c.color + "15" : colors.card,
                    },
                  ]}
                  onPress={() => {
                    setSelectedCat(c.id);
                    setSelectedService("");
                  }}
                >
                  <Feather
                    name={c.icon as any}
                    size={14}
                    color={selectedCat === c.id ? c.color : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.catChipText,
                      { color: selectedCat === c.id ? c.color : colors.mutedForeground },
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {selectedCat &&
              SERVICES.filter((s) => s.categoryId === selectedCat).map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.serviceOption,
                    {
                      borderColor: selectedService === s.id ? colors.primary : colors.border,
                      backgroundColor:
                        selectedService === s.id ? colors.primary + "10" : colors.card,
                    },
                  ]}
                  onPress={() => setSelectedService(s.id)}
                >
                  <View style={styles.serviceOptionInfo}>
                    <Text style={[styles.serviceOptionName, { color: colors.foreground }]}>
                      {s.name}
                    </Text>
                    <Text style={[styles.serviceOptionDesc, { color: colors.mutedForeground }]}>
                      {s.description}
                    </Text>
                  </View>
                  <View>
                    <Text style={[styles.serviceOptionPrice, { color: colors.primary }]}>
                      {s.basePrice} {STRINGS.common.sar}
                    </Text>
                    {selectedService === s.id && (
                      <Feather name="check-circle" size={20} color={colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            <TouchableOpacity
              style={[
                styles.nextBtn,
                { backgroundColor: colors.primary },
                !selectedService && { opacity: 0.5 },
              ]}
              onPress={() => setStep("details")}
              disabled={!selectedService}
            >
              <Text style={styles.nextBtnText}>{STRINGS.common.next}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "details" && (
          <View>
            {service && (
              <View style={[styles.selectedServiceBadge, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" }]}>
                <Feather name="scissors" size={16} color={colors.primary} />
                <Text style={[styles.selectedServiceText, { color: colors.primary }]}>
                  {service.name}
                </Text>
                <TouchableOpacity onPress={() => setStep("select-service")}>
                  <Text style={[styles.changeText, { color: colors.accent }]}>تغيير</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              تفاصيل الطلب
            </Text>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {STRINGS.request.selectLocation}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: colors.input, backgroundColor: colors.muted },
                ]}
              >
                <Feather name="map-pin" size={18} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="أدخل عنوانك..."
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="right"
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                {STRINGS.request.notes}
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    borderColor: colors.input,
                    backgroundColor: colors.muted,
                    color: colors.foreground,
                  },
                ]}
                value={notes}
                onChangeText={setNotes}
                placeholder="أي تفاصيل إضافية..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlign="right"
                textAlignVertical="top"
              />
            </View>
            <TouchableOpacity
              style={[
                styles.nextBtn,
                { backgroundColor: colors.primary },
                !address && { opacity: 0.5 },
              ]}
              onPress={handleSubmit}
              disabled={!address}
            >
              <Text style={styles.nextBtnText}>{STRINGS.request.submit}</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === "waiting" && (
          <View style={styles.waitingArea}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.waitingTitle, { color: colors.foreground }]}>
              {STRINGS.request.waiting}
            </Text>
            <Text style={[styles.waitingDesc, { color: colors.mutedForeground }]}>
              يتم إرسال طلبك لمزودي الخدمة القريبين...
            </Text>
            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                ستصلك العروض خلال دقائق قليلة
              </Text>
            </View>
          </View>
        )}

        {step === "offers" && currentOrder?.offers && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              {STRINGS.request.offersReceived}
            </Text>
            <Text style={[styles.offersCount, { color: colors.mutedForeground }]}>
              {currentOrder.offers.length} عرض متاح
            </Text>
            {currentOrder.offers.map((offer) => (
              <View
                key={offer.id}
                style={[styles.offerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={styles.offerHeader}>
                  <View style={[styles.offerAvatar, { backgroundColor: colors.primary + "20" }]}>
                    <Feather name="user" size={20} color={colors.primary} />
                  </View>
                  <View style={styles.offerInfo}>
                    <Text style={[styles.offerName, { color: colors.foreground }]}>
                      {offer.providerName}
                    </Text>
                    <View style={styles.offerRatingRow}>
                      <Feather name="star" size={12} color={colors.accent} />
                      <Text style={[styles.offerRating, { color: colors.mutedForeground }]}>
                        {" "}{offer.providerRating}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.offerPricing}>
                    <Text style={[styles.offerPrice, { color: colors.primary }]}>
                      {offer.price} {STRINGS.common.sar}
                    </Text>
                    <Text style={[styles.offerEta, { color: colors.mutedForeground }]}>
                      {offer.eta} {STRINGS.request.minutes}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleAcceptOffer(offer.id)}
                >
                  <Text style={styles.acceptBtnText}>{STRINGS.request.selectOffer}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  backBtn: { padding: 4, marginEnd: 12 },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  stepsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
    justifyContent: "center",
  },
  stepDot: {
    width: 40,
    height: 6,
    borderRadius: 3,
  },
  stepTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
    marginBottom: 16,
  },
  catRow: {
    marginHorizontal: -4,
    marginBottom: 16,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
    gap: 6,
  },
  catChipText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  serviceOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  serviceOptionInfo: { flex: 1 },
  serviceOptionName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    marginBottom: 3,
  },
  serviceOptionDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  serviceOptionPrice: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  nextBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  selectedServiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  selectedServiceText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  changeText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textAlign: "right",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  notesInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 90,
  },
  waitingArea: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 16,
  },
  waitingTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  waitingDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  infoBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  offersCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginBottom: 16,
  },
  offerCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  offerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  offerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 12,
  },
  offerInfo: { flex: 1 },
  offerName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    marginBottom: 3,
  },
  offerRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  offerRating: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  offerPricing: { alignItems: "flex-end" },
  offerPrice: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginBottom: 3,
  },
  offerEta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  acceptBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  acceptBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
