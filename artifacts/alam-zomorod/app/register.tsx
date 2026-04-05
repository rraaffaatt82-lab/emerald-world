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
import { useAuth, UserRole, ProviderType } from "@/context/AuthContext";
import { STRINGS } from "@/constants/strings";

export default function RegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("customer");
  const [providerType, setProviderType] = useState<ProviderType>("freelancer");
  const [showPass, setShowPass] = useState(false);

  async function handleRegister() {
    if (!name || !phone || !password) {
      Alert.alert("خطأ", "يرجى إدخال جميع البيانات المطلوبة");
      return;
    }
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await register({
        name,
        phone,
        password,
        role,
        providerType: role === "provider" ? providerType : undefined,
      });
      router.replace("/(tabs)");
    } catch {
      Alert.alert("خطأ", "حدث خطأ أثناء إنشاء الحساب");
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
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {STRINGS.auth.register}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {STRINGS.auth.selectRole}
          </Text>
          <View style={styles.roleRow}>
            {(["customer", "provider"] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleBtn,
                  {
                    borderColor: role === r ? colors.primary : colors.border,
                    backgroundColor: role === r ? colors.primary + "15" : colors.card,
                  },
                ]}
                onPress={() => setRole(r)}
              >
                <Feather
                  name={r === "customer" ? "user" : "briefcase"}
                  size={22}
                  color={role === r ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.roleBtnText,
                    { color: role === r ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {r === "customer" ? STRINGS.auth.asCustomer : STRINGS.auth.asProvider}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {role === "provider" && (
            <View style={styles.providerTypeRow}>
              {(["salon", "freelancer"] as ProviderType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.typeBtn,
                    {
                      borderColor: providerType === t ? colors.accent : colors.border,
                      backgroundColor: providerType === t ? colors.accent + "15" : colors.muted,
                    },
                  ]}
                  onPress={() => setProviderType(t)}
                >
                  <Text
                    style={[
                      styles.typeBtnText,
                      { color: providerType === t ? colors.accent : colors.mutedForeground },
                    ]}
                  >
                    {t === "salon" ? STRINGS.auth.salon : STRINGS.auth.freelancer}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.foreground }]}>
              {STRINGS.auth.name}
            </Text>
            <View style={[styles.inputWrapper, { borderColor: colors.input, backgroundColor: colors.muted }]}>
              <Feather name="user" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={name}
                onChangeText={setName}
                placeholder="الاسم الكامل"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
            </View>
          </View>

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
              styles.registerBtn,
              { backgroundColor: colors.primary },
              isLoading && { opacity: 0.7 },
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.registerBtnText}>
              {isLoading ? "جارٍ إنشاء الحساب..." : STRINGS.auth.register}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              {STRINGS.auth.hasAccount}
            </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.linkText, { color: colors.primary }]}>
                {STRINGS.auth.login}
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
  content: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backBtn: { padding: 4, marginEnd: 12 },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  card: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 14,
    textAlign: "right",
  },
  roleRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  roleBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  roleBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  providerTypeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
  },
  typeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  field: { marginBottom: 16 },
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
  registerBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  registerBtnText: {
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
