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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState("0501234567");
  const [password, setPassword] = useState("123456");
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!phone || !password) {
      Alert.alert("خطأ", "يرجى إدخال رقم الهاتف وكلمة المرور");
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login(phone, password);
      router.replace("/(tabs)");
    } catch {
      Alert.alert("خطأ", "بيانات تسجيل الدخول غير صحيحة");
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoArea}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Feather name="star" size={40} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>
            {STRINGS.appName}
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            {STRINGS.tagline}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {STRINGS.auth.welcomeBack}
          </Text>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {STRINGS.auth.phone}
            </Text>
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
            <Text style={[styles.label, { color: colors.foreground }]}>
              {STRINGS.auth.password}
            </Text>
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
            style={[
              styles.loginBtn,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.loginBtnText}>جارٍ تسجيل الدخول...</Text>
            ) : (
              <Text style={styles.loginBtnText}>{STRINGS.auth.login}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {STRINGS.auth.noAccount}
            </Text>
            <TouchableOpacity onPress={() => router.push("/register")}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {STRINGS.auth.register}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  logoArea: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 24,
    textAlign: "right",
  },
  field: {
    marginBottom: 16,
  },
  label: {
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
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  loginBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
});
