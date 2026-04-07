import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const { width: SW } = Dimensions.get("window");
const ONBOARDING_KEY = "azom_onboarding_done_v1";

const SLIDES = [
  {
    id: 1,
    icon: "✨",
    title: "أهلاً بكِ في عالم زمرد",
    subtitle: "لجمالكِ و رونقكِ",
    desc: "منصتكِ الأولى لخدمات التجميل المنزلية في الأردن — على بُعد لمسة واحدة",
    bg: "#fce4ec",
    accent: "#d63a6e",
  },
  {
    id: 2,
    icon: "💅",
    title: "اطلبي خدمتكِ",
    subtitle: "شعر · مكياج · أظافر · بشرة",
    desc: "اختاري الخدمة التي تريدينها وحددي موعدك — المزودات يتقدّمن بعروضهن لكِ",
    bg: "#f3e5f5",
    accent: "#9c27b0",
  },
  {
    id: 3,
    icon: "🌟",
    title: "صالونات وصبايا زمرد",
    subtitle: "المتخصصات في متناول يدكِ",
    desc: "اختاري بين صالونات محترفة أو صبايا زمرد المتنقلات — كلهن موثّقات ومُقيَّمات",
    bg: "#fff8e1",
    accent: "#c8a03a",
  },
  {
    id: 4,
    icon: "💛",
    title: "استمتعي بالتجربة",
    subtitle: "أمان · جودة · راحة",
    desc: "نظام تقييم شفاف، خصوصية كاملة، وإشعارات فورية — جمالكِ يستحق الأفضل",
    bg: "#e8f5e9",
    accent: "#2e7d32",
  },
];

function AppSplash({ onDone }: { onDone: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.splash, { opacity }]}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={styles.splashLogoWrap}>
          <Image
            source={require("@/assets/images/logo.jpeg")}
            style={styles.splashLogo}
            resizeMode="cover"
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function AppOnboarding({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const animateSlide = useCallback(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  function goNext() {
    if (current < SLIDES.length - 1) {
      const next = current + 1;
      setCurrent(next);
      scrollRef.current?.scrollTo({ x: next * SW, animated: true });
      animateSlide();
    } else {
      finish();
    }
  }

  function finish() {
    AsyncStorage.setItem(ONBOARDING_KEY, "1");
    onDone();
  }

  const slide = SLIDES[current];

  return (
    <View style={[styles.onboardingWrap, { backgroundColor: slide.bg }]}>
      <View style={[styles.onboardingInner, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20 }]}>

        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={[styles.skipText, { color: slide.accent }]}>تخطي</Text>
        </TouchableOpacity>

        <Animated.View style={{ flex: 1, alignItems: "center", justifyContent: "center", opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={[styles.onboardingIconWrap, { backgroundColor: slide.accent + "18" }]}>
            <Text style={styles.onboardingEmoji}>{slide.icon}</Text>
          </View>

          <Image
            source={require("@/assets/images/logo.jpeg")}
            style={styles.onboardingLogo}
            resizeMode="cover"
          />

          <Text style={[styles.onboardingTitle, { color: slide.accent }]}>{slide.title}</Text>
          <Text style={[styles.onboardingSubtitle, { color: slide.accent + "cc" }]}>{slide.subtitle}</Text>
          <Text style={[styles.onboardingDesc, { color: "#444" }]}>{slide.desc}</Text>
        </Animated.View>

        <View style={styles.onboardingBottom}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i === current ? slide.accent : slide.accent + "40", width: i === current ? 24 : 8 },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: slide.accent }]}
            onPress={goNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {current === SLIDES.length - 1 ? "ابدئي الآن" : "التالي"}
            </Text>
            <Feather name={current === SLIDES.length - 1 ? "check" : "arrow-left"} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(provider)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="request-service" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="provider/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="otp-verify" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === "1");
    });
  }, []);

  if (!fontsLoaded && !fontError) return null;

  const showOnboarding = splashDone && onboardingDone === false;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                  {!splashDone && <AppSplash onDone={() => setSplashDone(true)} />}
                  {showOnboarding && (
                    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                      <AppOnboarding onDone={() => setOnboardingDone(true)} />
                    </View>
                  )}
                </KeyboardProvider>
              </GestureHandlerRootView>
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#fde8f3",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  splashLogoWrap: {
    width: 260,
    height: 260,
    borderRadius: 36,
    overflow: "hidden",
    shadowColor: "#c8a03a",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  splashLogo: {
    width: 260,
    height: 260,
  },
  onboardingWrap: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9000,
  },
  onboardingInner: {
    flex: 1,
    paddingHorizontal: 24,
  },
  skipBtn: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  onboardingIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  onboardingEmoji: {
    fontSize: 48,
  },
  onboardingLogo: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 28,
  },
  onboardingTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 6,
  },
  onboardingSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    marginBottom: 16,
  },
  onboardingDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  onboardingBottom: {
    gap: 20,
    paddingBottom: 8,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  nextBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
