import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { STRINGS } from "@/constants/strings";

const DEMO_ACCOUNTS = [
  { label: "عميل", phone: "0501234567", pass: "1234", icon: "user", color: "#2196f3" },
  { label: "مزودة (موثقة)", phone: "0501234001", pass: "1234", icon: "scissors", color: "#9c27b0" },
  { label: "مزودة (قيد المراجعة)", phone: "0501234005", pass: "1234", icon: "clock", color: "#ff9800" },
  { label: "أدمن", phone: "0500000000", pass: "admin123", icon: "shield", color: "#c8a951" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState("0501234567");
  const [password, setPassword] = useState("1234");
  const [showPass, setShowPass] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert("خطأ", "يرجى إدخال رقم الهاتف وكلمة المرور");
      return;
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await login(phone, password);
    if (!result.success) {
      Alert.alert("خطأ في تسجيل الدخول", result.error || "بيانات غير صحيحة");
      return;
    }
    if (result.role === "admin") {
      router.replace("/(admin)");
    } else if (result.role === "provider") {
      router.replace("/(provider)/requests");
    } else {
      router.replace("/(tabs)");
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>{STRINGS.appName}</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{STRINGS.tagline}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{STRINGS.auth.welcomeBack}</Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>{STRINGS.auth.phone}</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.input, backgroundColor: colors.muted }]}>
              <Feather name="phone" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="05xxxxxxxx"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>{STRINGS.auth.password}</Text>
            <View style={[styles.inputWrapper, { borderColor: colors.input, backgroundColor: colors.muted }]}>
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPass}
                textAlign="right"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginBtnText}>{isLoading ? "جارٍ تسجيل الدخول..." : STRINGS.auth.login}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.demoToggle, { borderColor: colors.border }]}
            onPress={() => setShowDemo(!showDemo)}
          >
            <Feather name={showDemo ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
            <Text style={[styles.demoToggleText, { color: colors.mutedForeground }]}>حسابات تجريبية للمعاينة</Text>
          </TouchableOpacity>

          {showDemo && (
            <View style={styles.demoList}>
              {DEMO_ACCOUNTS.map((acc) => (
                <TouchableOpacity
                  key={acc.phone}
                  style={[styles.demoItem, { borderColor: acc.color + "40", backgroundColor: acc.color + "10" }]}
                  onPress={() => { setPhone(acc.phone); setPassword(acc.pass); setShowDemo(false); }}
                >
                  <View>
                    <Text style={[styles.demoPass, { color: colors.mutedForeground }]}>{acc.pass}</Text>
                    <Text style={[styles.demoPhone, { color: colors.foreground }]}>{acc.phone}</Text>
                  </View>
                  <View style={styles.demoBadge}>
                    <Feather name={acc.icon as any} size={14} color={acc.color} />
                    <Text style={[styles.demoBadgeText, { color: acc.color }]}>{acc.label}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

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
  logoArea: { alignItems: "center", marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { fontSize: 15, fontFamily: "Inter_400Regular" },
  card: { width: "100%", borderRadius: 20, padding: 24, borderWidth: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 24, textAlign: "right" },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 8, textAlign: "right" },
  inputWrapper: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  input: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  loginBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  loginBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  demoToggle: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderTopWidth: 1, marginTop: 16, gap: 8 },
  demoToggleText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  demoList: { gap: 8, marginBottom: 8 },
  demoItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1 },
  demoBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  demoBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  demoPhone: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  demoPass: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "right" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20, gap: 6 },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  linkText: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
