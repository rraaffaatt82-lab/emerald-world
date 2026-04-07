import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Image,
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
import { STRINGS } from "@/constants/strings";
import { sendOtp } from "@/services/otpService";

const DEMO_PHONES = ["1", "2", "3"];

const DEMO_ACCOUNTS = [
  { label: "عميل", desc: "سارة أحمد", phone: "1", icon: "user", color: "#8c1a44" },
  { label: "مزودة خدمة", desc: "نور الجمال", phone: "2", icon: "scissors", color: "#c8a03a" },
  { label: "أدمن", desc: "مدير النظام", phone: "3", icon: "shield", color: "#6b0f34" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loginByPhone } = useAuth();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function handleSendOtp() {
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("يرجى إدخال رقم الهاتف");
      return;
    }
    setError("");
    setSending(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Demo phones: skip OTP entirely, login directly
    if (DEMO_PHONES.includes(trimmed)) {
      const result = await loginByPhone(trimmed);
      setSending(false);
      if (!result.success) {
        setError(result.error || "تعذّر تسجيل الدخول");
        return;
      }
      if (result.role === "admin") router.replace("/(admin)");
      else if (result.role === "provider") router.replace("/(provider)/requests");
      else router.replace("/(tabs)");
      return;
    }

    const result = await sendOtp(trimmed);
    setSending(false);

    if (!result.success) {
      setError(result.error || "فشل إرسال رمز التحقق");
      return;
    }

    router.push({
      pathname: "/otp-verify",
      params: { phone: trimmed, mode: "login" },
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 48, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={styles.logoImgWrap}>
            <Image
              source={require("@/assets/images/logo.jpeg")}
              style={styles.logoImg}
              resizeMode="cover"
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{STRINGS.auth.welcomeBack}</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            أدخلي رقم هاتفك وسنرسل لكِ رمز التحقق
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>{STRINGS.auth.phone}</Text>
            <View style={[styles.inputWrapper, { borderColor: phone ? colors.primary : colors.input, backgroundColor: colors.muted }]}>
              <Feather name="phone" size={18} color={phone ? colors.primary : colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="أدخل رقم الهاتف"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                textAlign="right"
                autoComplete="off"
                onSubmitEditing={handleSendOtp}
                returnKeyType="send"
              />
            </View>
          </View>

          {error !== "" && (
            <View style={{ backgroundColor: "#fce4ec", borderRadius: 10, padding: 10, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
              <Text style={{ color: "#c2185b", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" }}>{error}</Text>
              <Feather name="alert-circle" size={14} color="#c2185b" />
            </View>
          )}

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }, sending && { opacity: 0.7 }]}
            onPress={handleSendOtp}
            disabled={sending}
            activeOpacity={0.85}
          >
            {sending ? (
              <Text style={styles.loginBtnText}>جارٍ الدخول...</Text>
            ) : (
              <>
                <Feather name="arrow-left" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>متابعة</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.divider, { borderTopColor: colors.border }]}>
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>أو جرّب بحساب تجريبي</Text>
          </View>

          <View style={styles.demoList}>
            {DEMO_ACCOUNTS.map((acc) => (
              <TouchableOpacity
                key={acc.phone}
                style={[styles.demoItem, { borderColor: acc.color + "30", backgroundColor: acc.color + "08" }]}
                onPress={async () => {
                  Haptics.selectionAsync();
                  setError("");
                  setSending(true);
                  const result = await loginByPhone(acc.phone);
                  setSending(false);
                  if (!result.success) { setError(result.error || "خطأ"); return; }
                  if (result.role === "admin") router.replace("/(admin)");
                  else if (result.role === "provider") router.replace("/(provider)/requests");
                  else router.replace("/(tabs)");
                }}
              >
                <View style={styles.demoLeft}>
                  <Text style={[styles.demoPass, { color: colors.mutedForeground }]}>اضغط للدخول مباشرة</Text>
                  <Text style={[styles.demoDesc, { color: colors.foreground }]}>{acc.desc}</Text>
                </View>
                <View style={[styles.demoBadge, { backgroundColor: acc.color + "15" }]}>
                  <Feather name={acc.icon as any} size={14} color={acc.color} />
                  <Text style={[styles.demoBadgeText, { color: acc.color }]}>{acc.label}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>{STRINGS.auth.noAccount}</Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={[styles.linkText, { color: colors.primary }]}>{STRINGS.auth.register}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, alignItems: "center" },
  logoArea: { alignItems: "center", marginBottom: 28 },
  logoImgWrap: {
    width: 200, height: 200, borderRadius: 30, overflow: "hidden",
    shadowColor: "#c8a03a", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.35, shadowRadius: 22, elevation: 14,
    borderWidth: 2, borderColor: "#e8c8d8",
  },
  logoImg: { width: 200, height: 200 },
  card: { width: "100%", borderRadius: 24, padding: 24, borderWidth: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 6, textAlign: "right" },
  hint: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20, textAlign: "right" },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8, textAlign: "right" },
  inputWrapper: {
    flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1.5,
    paddingHorizontal: 14, paddingVertical: 13, gap: 10,
  },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  loginBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    borderRadius: 16, paddingVertical: 15, marginTop: 6, gap: 10,
    shadowColor: "#8c1a44", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  loginBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  divider: { borderTopWidth: 1, marginVertical: 18, paddingTop: 18, alignItems: "center" },
  dividerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  demoList: { gap: 8 },
  demoItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1.5 },
  demoLeft: { alignItems: "flex-end" },
  demoDesc: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  demoPass: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 2 },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  demoBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20, gap: 6 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
