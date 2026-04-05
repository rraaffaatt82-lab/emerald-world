import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
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
import { STRINGS } from "@/constants/strings";

const DEMO_ACCOUNTS = [
  { label: "عميل", desc: "سارة أحمد", phone: "1", pass: "1234", icon: "user", color: "#e91e63" },
  { label: "مزودة خدمة", desc: "نور الجمال", phone: "2", pass: "1234", icon: "scissors", color: "#9c27b0" },
  { label: "أدمن", desc: "مدير النظام", phone: "3", pass: "1234", icon: "shield", color: "#c2185b" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function handleLogin() {
    if (!phone.trim()) {
      setLoginError("يرجى إدخال رقم الهاتف");
      return;
    }
    if (!password.trim()) {
      setLoginError("يرجى إدخال كلمة المرور");
      return;
    }
    setLoginError("");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await login(phone.trim(), password);
    if (!result.success) {
      setLoginError(result.error || "بيانات غير صحيحة");
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoEmoji}>💎</Text>
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>{STRINGS.appName}</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>{STRINGS.tagline}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{STRINGS.auth.welcomeBack}</Text>

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
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>{STRINGS.auth.password}</Text>
            <View style={[styles.inputWrapper, { borderColor: password ? colors.primary : colors.input, backgroundColor: colors.muted }]}>
              <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="كلمة المرور"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPass}
                textAlign="right"
              />
            </View>
          </View>

          {loginError !== "" && (
            <View style={{ backgroundColor: "#fce4ec", borderRadius: 10, padding: 10, marginBottom: 12 }}>
              <Text style={{ color: "#c2185b", fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>{loginError}</Text>
            </View>
          )}
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }, isLoading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <Text style={styles.loginBtnText}>جارٍ تسجيل الدخول...</Text>
            ) : (
              <>
                <Feather name="log-in" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>{STRINGS.auth.login}</Text>
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
                onPress={() => {
                  Haptics.selectionAsync();
                  setPhone(acc.phone);
                  setPassword(acc.pass);
                  setShowDemo(false);
                }}
              >
                <View style={styles.demoLeft}>
                  <Text style={[styles.demoPass, { color: colors.mutedForeground }]}>
                    رقم: {acc.phone} | باسورد: {acc.pass}
                  </Text>
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
  logoCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: "center", justifyContent: "center", marginBottom: 14,
    shadowColor: "#c2185b", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 10,
  },
  logoEmoji: { fontSize: 38 },
  appName: { fontSize: 30, fontFamily: "Inter_700Bold", marginBottom: 4 },
  tagline: { fontSize: 15, fontFamily: "Inter_400Regular" },
  card: { width: "100%", borderRadius: 24, padding: 24, borderWidth: 1 },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 20, textAlign: "right" },
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
    shadowColor: "#c2185b", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
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
