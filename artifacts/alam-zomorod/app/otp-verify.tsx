import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { verifyOtp, sendOtp, OTP_LENGTH } from "@/services/otpService";

const RESEND_SECONDS = 60;

export default function OtpVerifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { loginByPhone, register, isLoading } = useAuth();
  const params = useLocalSearchParams<{
    phone: string;
    mode: "login" | "register";
    demoCode?: string;
    name?: string;
    role?: string;
    providerType?: string;
    city?: string;
  }>();

  const { phone, mode, demoCode, name, role, providerType, city } = params;

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const webTopPad = Platform.OS === "web" ? 67 : 0;

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [countdown]);

  function shake() {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleDigitChange(text: string, index: number) {
    const clean = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    setError("");

    if (clean && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (clean && index === OTP_LENGTH - 1) {
      const fullCode = [...next.slice(0, index), clean].join("");
      if (fullCode.length === OTP_LENGTH) {
        setTimeout(() => handleVerify(fullCode), 100);
      }
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = "";
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  const handleVerify = useCallback(async (code?: string) => {
    const finalCode = code ?? digits.join("");
    if (finalCode.length < OTP_LENGTH) {
      setError("أدخل الرمز كاملاً");
      shake();
      return;
    }

    const result = verifyOtp(phone, finalCode);
    if (!result.valid) {
      setError(result.error || "رمز غير صحيح");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      return;
    }

    setSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (mode === "register") {
      await register({
        name: name || "مستخدم جديد",
        phone,
        password: "",
        role: (role as any) || "customer",
        providerType: providerType as any,
      });
      if (role === "provider") {
        router.replace("/(provider)/requests");
      } else {
        router.replace("/(tabs)");
      }
    } else {
      const loginResult = await loginByPhone(phone);
      if (!loginResult.success) {
        setError(loginResult.error || "تعذّر تسجيل الدخول");
        setSuccess(false);
        return;
      }
      if (loginResult.role === "admin") {
        router.replace("/(admin)");
      } else if (loginResult.role === "provider") {
        router.replace("/(provider)/requests");
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [digits, phone, mode, name, role, providerType]);

  async function handleResend() {
    setResending(true);
    setError("");
    setDigits(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    const result = await sendOtp(phone);
    setResending(false);
    if (!result.success) {
      setError(result.error || "فشل إعادة الإرسال");
    } else {
      setCountdown(RESEND_SECONDS);
    }
  }

  const maskedPhone = phone.length > 4
    ? phone.slice(0, 3) + "****" + phone.slice(-2)
    : phone;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + webTopPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>

        <View style={styles.logoWrap}>
          <Image
            source={require("@/assets/images/logo.jpeg")}
            style={styles.logo}
            resizeMode="cover"
          />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>التحقق من رقم الهاتف</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          أُرسِل رمز التحقق إلى{"\n"}
          <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>{maskedPhone}</Text>
        </Text>

        {demoCode ? (
          <View style={[styles.demoBanner, { backgroundColor: "#d63a6e15", borderColor: "#d63a6e60" }]}>
            <View style={{ flex: 1, alignItems: "flex-end", gap: 4 }}>
              <Text style={{ color: "#8c1040", fontSize: 12, fontFamily: "Inter_400Regular" }}>
                هذا تطبيق تجريبي — الرمز هو:
              </Text>
              <Text style={{ color: "#d63a6e", fontSize: 26, fontFamily: "Inter_700Bold", letterSpacing: 6 }}>
                {demoCode}
              </Text>
              <Text style={{ color: "#8c1040", fontSize: 11, fontFamily: "Inter_400Regular" }}>
                اكتبيه في المربعات أعلاه
              </Text>
            </View>
            <Feather name="lock" size={22} color="#d63a6e" />
          </View>
        ) : null}

        <Animated.View style={[styles.boxesRow, { transform: [{ translateX: shakeAnim }] }]}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => { inputRefs.current[i] = r; }}
              style={[
                styles.box,
                {
                  borderColor: d ? colors.primary : error ? "#f44336" : colors.border,
                  backgroundColor: d ? colors.primary + "12" : colors.card,
                  color: colors.foreground,
                },
                success && { borderColor: "#4caf50", backgroundColor: "#e8f5e9" },
              ]}
              value={d}
              onChangeText={(t) => handleDigitChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectionColor={colors.primary}
              autoFocus={i === 0}
            />
          ))}
        </Animated.View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: "#fce4ec" }]}>
            <Feather name="alert-circle" size={14} color="#c2185b" />
            <Text style={[styles.errorText, { color: "#c2185b" }]}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={[styles.errorBox, { backgroundColor: "#e8f5e9" }]}>
            <Feather name="check-circle" size={14} color="#4caf50" />
            <Text style={[styles.errorText, { color: "#2e7d32" }]}>تم التحقق بنجاح! جارٍ الدخول...</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.verifyBtn,
            { backgroundColor: colors.primary },
            (isLoading || success) && { opacity: 0.7 },
          ]}
          onPress={() => handleVerify()}
          disabled={isLoading || success}
          activeOpacity={0.85}
        >
          {isLoading || success ? (
            <Text style={styles.verifyBtnText}>جارٍ التحقق...</Text>
          ) : (
            <>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.verifyBtnText}>تحقق من الرمز</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={[styles.countdownText, { color: colors.mutedForeground }]}>
              إعادة الإرسال بعد <Text style={{ color: colors.primary, fontFamily: "Inter_700Bold" }}>{countdown}</Text> ثانية
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={[styles.resendText, { color: colors.primary }]}>
                {resending ? "جارٍ الإرسال..." : "إعادة إرسال الرمز"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  backBtn: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  logoWrap: {
    width: 90,
    height: 90,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#c8a03a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 90,
    height: 90,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 20,
    alignSelf: "stretch",
    justifyContent: "flex-end",
  },
  boxesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
    justifyContent: "center",
  },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    alignSelf: "stretch",
    justifyContent: "flex-end",
  },
  errorText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  verifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    paddingVertical: 15,
    alignSelf: "stretch",
    shadowColor: "#8c1a44",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  verifyBtnText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  resendRow: {
    alignItems: "center",
  },
  countdownText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  resendText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    textDecorationLine: "underline",
  },
});
