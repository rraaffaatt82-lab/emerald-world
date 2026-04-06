import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData, SERVICES } from "@/context/DataContext";
import { toHijriShort } from "@/utils/date";
import { StarRating } from "@/components/ui/StarRating";
import { Badge } from "@/components/ui/Badge";

type TabKey = "overview" | "services" | "wallet" | "notifications" | "packages" | "portfolio" | "schedule";

export default function ProviderProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const {
    providers, updateProvider, getRequestsByProvider, walletTransactions,
    requestWalletTopup, notifications, markNotificationRead, markAllRead,
    customProviderServices, addCustomProviderService, deleteCustomProviderService,
    addPortfolioPhoto, removePortfolioPhoto, submitProfileChangeRequest,
    setProviderRadius, packages, addPackage, deletePackage, setProviderWorkingHours,
  } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;
  const [tab, setTab] = useState<TabKey>("overview");
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupNote, setTopupNote] = useState("");
  const [topupSuccess, setTopupSuccess] = useState(false);
  const [topupError, setTopupError] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [showAddSvcModal, setShowAddSvcModal] = useState(false);
  const [newSvcName, setNewSvcName] = useState("");
  const [newSvcDesc, setNewSvcDesc] = useState("");
  const [newSvcPrice, setNewSvcPrice] = useState("");
  const [newSvcDuration, setNewSvcDuration] = useState("");
  const [addSvcError, setAddSvcError] = useState("");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showPhoneEditModal, setShowPhoneEditModal] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [phoneSubmitSuccess, setPhoneSubmitSuccess] = useState(false);
  const [showPortfolioAdd, setShowPortfolioAdd] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioCaption, setPortfolioCaption] = useState("");
  const [portfolioRemoveId, setPortfolioRemoveId] = useState<string | null>(null);
  const [showAddPackage, setShowAddPackage] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgDesc, setPkgDesc] = useState("");
  const [pkgPrice, setPkgPrice] = useState("");
  const [pkgDuration, setPkgDuration] = useState("");
  const [pkgSessions, setPkgSessions] = useState("");
  const [pkgError, setPkgError] = useState("");
  const [pkgDeleteId, setPkgDeleteId] = useState<string | null>(null);
  const [editRadius, setEditRadius] = useState("");
  const [pickedPortfolioUri, setPickedPortfolioUri] = useState<string | null>(null);
  const [detectingRadius, setDetectingRadius] = useState(false);

  const DAY_NAMES = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
  const DAY_KEYS = ["sat", "sun", "mon", "tue", "wed", "thu", "fri"];
  const defaultWorkingHours = DAY_KEYS.map((key) => ({ day: key, isWorking: key !== "fri", from: "09:00", to: "18:00" }));
  const [scheduleHours, setScheduleHours] = useState(() => {
    const prov = providers.find((p: any) => p.id === user?.id);
    return (prov as any)?.workingHours ?? defaultWorkingHours;
  });
  function toggleDay(idx: number) {
    setScheduleHours((prev: any) => {
      const next = [...prev];
      next[idx] = { ...next[idx], isWorking: !next[idx].isWorking };
      return next;
    });
  }
  function setDayTime(idx: number, field: "from" | "to", val: string) {
    setScheduleHours((prev: any) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }
  function saveSchedule() {
    if (user) setProviderWorkingHours(user.id, scheduleHours);
  }

  async function pickPortfolioPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedPortfolioUri(result.assets[0].uri);
    }
  }

  async function detectRadiusLocation() {
    if (!provider) return;
    setDetectingRadius(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
    } catch { }
    setDetectingRadius(false);
  }

  const provider = providers.find((p) => p.id === user?.id);
  const myJobs = getRequestsByProvider(user?.id || "");
  const completedCount = myJobs.filter((r) => r.status === "completed").length;
  const txs = walletTransactions.filter((t) => t.userId === user?.id);
  const myNotifications = notifications.filter((n) => n.userId === user?.id);
  const unreadCount = myNotifications.filter((n) => !n.isRead).length;

  const filteredServices = serviceFilter
    ? SERVICES.filter((s) => s.name.includes(serviceFilter) || s.description.includes(serviceFilter))
    : SERVICES;

  function handleToggleAvailable() {
    if (!provider) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateProvider(provider.id, { isAvailable: !provider.isAvailable });
  }

  function handleTopupRequest() {
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount <= 0) {
      setTopupError("يرجى إدخال مبلغ صحيح");
      return;
    }
    requestWalletTopup(user!.id, user!.name, amount, topupNote || undefined);
    setTopupSuccess(true);
    setTopupError("");
  }

  function handleCloseTopup() {
    setShowTopupModal(false);
    setTopupAmount("");
    setTopupNote("");
    setTopupSuccess(false);
    setTopupError("");
  }

  async function handleLogoutConfirm() {
    setShowLogoutConfirm(false);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/login");
  }

  function handleSaveProfile() {
    if (!provider) return;
    updateProvider(provider.id, {
      bio: editBio.trim(),
      location: { ...provider.location, address: editLocation.trim() || provider.location.address },
    });
    setShowEditProfile(false);
  }

  function handleToggleService(serviceId: string) {
    if (!provider) return;
    const hasService = provider.services.includes(serviceId);
    const updated = hasService
      ? provider.services.filter((s) => s !== serviceId)
      : [...provider.services, serviceId];
    updateProvider(provider.id, { services: updated });
  }

  function handleAddCustomSvc() {
    if (!newSvcName.trim() || !user) return;
    const price = parseFloat(newSvcPrice);
    if (isNaN(price) || price <= 0) {
      setAddSvcError("يرجى إدخال سعر صحيح");
      return;
    }
    addCustomProviderService({
      providerId: user.id,
      name: newSvcName.trim(),
      description: newSvcDesc.trim(),
      price,
      duration: parseInt(newSvcDuration) || undefined,
    });
    setShowAddSvcModal(false);
    setNewSvcName("");
    setNewSvcDesc("");
    setNewSvcPrice("");
    setNewSvcDuration("");
    setAddSvcError("");
  }

  const myCustomServices = customProviderServices.filter((s) => s.providerId === user?.id);

  const myPackages = (packages || []).filter((p: any) => p.providerId === user?.id);
  const myPortfolio = provider?.portfolioPhotos || [];

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: "overview", label: "الملف", icon: "user" },
    { key: "services", label: "الخدمات", icon: "list" },
    { key: "packages", label: "الباقات", icon: "package" },
    { key: "portfolio", label: "أعمالي", icon: "image" },
    { key: "wallet", label: "المحفظة", icon: "credit-card" },
    { key: "schedule", label: "المواعيد", icon: "calendar" },
    { key: "notifications", label: unreadCount > 0 ? `(${unreadCount})` : "إشعارات", icon: "bell" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + webTopPad + 10, paddingBottom: insets.bottom + webBottomPad + 90 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: colors.foreground }]}>ملف مزود الخدمة</Text>

      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={{ position: "relative" }}
          onPress={async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") return;
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.8 });
            if (!result.canceled && result.assets[0] && provider) {
              updateProvider(provider.id, { photoUri: result.assets[0].uri });
            }
          }}
        >
          {provider?.photoUri ? (
            <Image source={{ uri: provider.photoUri }} style={[styles.avatar, { borderWidth: 3, borderColor: "rgba(255,255,255,0.6)" }]} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: provider?.avatarColor || "#fff" }]}>
              <Text style={[styles.avatarText, { color: provider?.avatarColor ? "#fff" : colors.primary }]}>
                {user?.name?.[0] || "م"}
              </Text>
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Feather name="camera" size={13} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.providerName}>{user?.name}</Text>
        <View style={styles.badges}>
          <Badge
            label={provider?.type === "salon" ? "صالون" : "فريلانسر"}
            variant="outline"
            style={{ borderColor: "rgba(255,255,255,0.5)" }}
          />
          {provider?.isVerified && (
            <Badge label="موثق ✓" variant="outline" style={{ borderColor: "rgba(255,255,255,0.5)" }} />
          )}
          <Badge
            label={provider?.status === "approved" ? "نشط" : provider?.status === "pending" ? "قيد المراجعة" : "موقوف"}
            variant={provider?.status === "approved" ? "success" : provider?.status === "pending" ? "warning" : "error"}
          />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <StarRating rating={provider?.rating || 0} size={14} />
            <Text style={styles.statVal}>{provider?.rating || 0}</Text>
            <Text style={styles.statLab}>{provider?.reviewsCount || 0} تقييم</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{completedCount}</Text>
            <Text style={styles.statLab}>منجز</Text>
          </View>
          <View style={styles.statDiv} />
          <View style={styles.stat}>
            <Text style={styles.statVal}>{provider?.walletBalance || 0}</Text>
            <Text style={styles.statLab}>د.أ رصيد</Text>
          </View>
        </View>
      </View>

      {provider?.status === "suspended" && provider.suspensionReason && (
        <View style={[styles.suspensionBanner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "30" }]}>
          <Feather name="alert-circle" size={18} color={colors.destructive} />
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <Text style={[styles.suspensionTitle, { color: colors.destructive }]}>تم تعليق حسابك</Text>
            <Text style={[styles.suspensionReason, { color: colors.mutedForeground }]}>السبب: {provider.suspensionReason}</Text>
          </View>
        </View>
      )}

      <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabBtn, tab === t.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={14} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabBtnText, { color: tab === t.key ? colors.primary : colors.mutedForeground, fontFamily: tab === t.key ? "Inter_700Bold" : "Inter_400Regular" }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "overview" && (
        <>
          <View style={[styles.availabilityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.availabilityRow}>
              <Switch
                value={provider?.isAvailable}
                onValueChange={handleToggleAvailable}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#fff"
              />
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.availLabel, { color: colors.foreground }]}>حالة التوفر</Text>
                <Text style={[styles.availDesc, { color: colors.mutedForeground }]}>
                  {provider?.isAvailable ? "أنت متاح لاستقبال الطلبات" : "أنت غير متاح حالياً"}
                </Text>
              </View>
            </View>
          </View>

          {provider?.bio ? (
            <View style={[styles.bioCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.bioTitle, { color: colors.foreground }]}>نبذة عني</Text>
              <Text style={[styles.bioText, { color: colors.mutedForeground }]}>{provider.bio}</Text>
            </View>
          ) : null}

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.infoCardHeader}>
              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setEditBio(provider?.bio || ""); setEditLocation(provider?.location?.address || ""); setShowEditProfile(true); }}
              >
                <Feather name="edit-2" size={14} color={colors.primary} />
                <Text style={[styles.editProfileBtnText, { color: colors.primary }]}>تعديل</Text>
              </TouchableOpacity>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>معلومات الحساب</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: colors.primary + "15" }]}
                onPress={() => { setNewPhone(provider?.phone || user?.phone || ""); setOtpSent(false); setOtpValue(""); setOtpError(""); setPhoneSubmitSuccess(false); setShowPhoneEditModal(true); }}
              >
                <Feather name="edit-2" size={12} color={colors.primary} />
                <Text style={[styles.editProfileBtnText, { color: colors.primary, fontSize: 12 }]}>تعديل</Text>
              </TouchableOpacity>
              <View style={styles.infoLabel}>
                <Text style={[styles.infoLabelText, { color: colors.mutedForeground }]}>رقم الهاتف</Text>
                <Feather name="phone" size={14} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{provider?.phone || user?.phone || "—"}</Text>
            </View>
            {provider?.pendingProfileChange && (
              <View style={{ backgroundColor: "#ff9800" + "20", borderRadius: 10, padding: 10, gap: 4 }}>
                <Text style={{ color: "#ff9800", fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" }}>⏳ طلب تعديل قيد المراجعة</Text>
                {provider.pendingProfileChange.phone && (
                  <Text style={{ color: "#aaa", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" }}>رقم مطلوب: {provider.pendingProfileChange.phone}</Text>
                )}
              </View>
            )}
            <InfoRow icon="map-pin" label="الموقع" value={provider?.location.address || "—"} colors={colors} />
            <InfoRow icon="calendar" label="تاريخ الانضمام" value={provider?.joinedAt || "—"} colors={colors} />
            <InfoRow icon="percent" label="نسبة العمولة" value={`${provider?.commission || 15}%`} colors={colors} />
            <InfoRow icon="gift" label="خدمات مجانية متبقية" value={String(provider?.freeServicesLeft || 0)} colors={colors} />
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: colors.primary + "15", borderWidth: 1, borderColor: colors.primary + "40", paddingVertical: 7, paddingHorizontal: 12 }]}
                onPress={detectRadiusLocation}
                disabled={detectingRadius}
              >
                <Feather name="navigation" size={14} color={colors.primary} />
                <Text style={[styles.editProfileBtnText, { color: colors.primary, fontSize: 12 }]}>
                  {detectingRadius ? "جارٍ..." : "تحديد موقعي"}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.infoTitle, { color: colors.foreground }]}>نطاق الخدمة</Text>
            </View>
            <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
              اختر نطاق الخدمة — ستصلك الطلبات ضمن هذه المسافة من موقعك الحالي
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              {[5, 10, 15, 20, 30, 50].map((km) => {
                const active = (provider?.serviceRadiusKm || 10) === km;
                return (
                  <TouchableOpacity
                    key={km}
                    style={[styles.radiusChip, { backgroundColor: active ? colors.primary : colors.muted, borderColor: active ? colors.primary : colors.border }]}
                    onPress={() => { if (provider) setProviderRadius(provider.id, km); }}
                  >
                    <Text style={{ color: active ? "#fff" : colors.mutedForeground, fontSize: 13, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }}>
                      {km} كم
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.destructive }]} onPress={() => setShowLogoutConfirm(true)}>
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.logoutText, { color: colors.destructive }]}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === "services" && (
        <>
          <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              value={serviceFilter}
              onChangeText={setServiceFilter}
              placeholder="ابحث في الخدمات..."
              placeholderTextColor={colors.mutedForeground}
              textAlign="right"
            />
          </View>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            اختاري الخدمات التي تقدمينها — يمكن تفعيل/تعطيل كل خدمة بشكل مستقل
          </Text>
          {filteredServices.map((s) => {
            const ps = provider?.providerServices?.find((ps) => ps.serviceId === s.id);
            const isActive = provider?.services.includes(s.id);
            return (
              <View key={s.id} style={[styles.serviceRow, { backgroundColor: colors.card, borderColor: isActive ? colors.primary + "40" : colors.border }]}>
                <View style={styles.serviceRight}>
                  <Switch
                    value={!!isActive}
                    onValueChange={() => handleToggleService(s.id)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#fff"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <View style={styles.servicePriceArea}>
                    <Text style={[styles.serviceCustomPrice, { color: colors.primary }]}>
                      {ps ? `${ps.customPrice} د.أ` : `${s.basePrice} د.أ`}
                    </Text>
                    <Text style={[styles.serviceDuration, { color: colors.mutedForeground }]}>{s.duration} د</Text>
                  </View>
                </View>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.serviceName, { color: colors.foreground }]}>{s.name}</Text>
                  <Text style={[styles.serviceDesc, { color: colors.mutedForeground }]}>{s.description}</Text>
                </View>
              </View>
            );
          })}
          {filteredServices.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="search" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد نتائج</Text>
            </View>
          )}

          <View style={[styles.customSvcHeader]}>
            <TouchableOpacity
              style={[styles.addSvcBtn, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddSvcModal(true)}
            >
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.addSvcBtnText}>إضافة خدمة مخصصة</Text>
            </TouchableOpacity>
            <Text style={[styles.customSvcTitle, { color: colors.foreground }]}>خدماتي المخصصة</Text>
          </View>

          {myCustomServices.length === 0 ? (
            <View style={[styles.emptyCustom, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="plus-square" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyCustomText, { color: colors.mutedForeground }]}>
                أضيفي خدماتك الخاصة — ستخضع لمراجعة الإدارة قبل النشر
              </Text>
            </View>
          ) : (
            myCustomServices.map((svc) => {
              const statusColor = svc.status === "approved" ? "#4caf50" : svc.status === "rejected" ? colors.destructive : "#ff9800";
              const statusLabel = svc.status === "approved" ? "معتمدة ✓" : svc.status === "rejected" ? "مرفوضة" : "قيد المراجعة";
              return (
                <View key={svc.id} style={[styles.customSvcRow, { backgroundColor: colors.card, borderColor: svc.status === "approved" ? colors.primary + "30" : statusColor + "30" }]}>
                  <TouchableOpacity
                    style={[styles.deleteSvcBtn, { backgroundColor: colors.destructive + "15" }]}
                    onPress={() => setDeleteConfirmId(svc.id)}
                  >
                    <Feather name="trash-2" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <View style={styles.customSvcNameRow}>
                      <View style={[styles.customBadge, { backgroundColor: statusColor + "20" }]}>
                        <Text style={[styles.customBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                      </View>
                      <Text style={[styles.customSvcName, { color: colors.foreground }]}>{svc.name}</Text>
                    </View>
                    {svc.description ? (
                      <Text style={[styles.customSvcDesc, { color: colors.mutedForeground }]}>{svc.description}</Text>
                    ) : null}
                    <View style={styles.customSvcMeta}>
                      <Text style={[styles.customSvcPrice, { color: colors.primary }]}>{svc.price} د.أ</Text>
                      {svc.duration ? (
                        <Text style={[styles.customSvcDur, { color: colors.mutedForeground }]}>{svc.duration} دقيقة</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </>
      )}

      {tab === "wallet" && (
        <>
          <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
            <Text style={styles.balanceLabel}>رصيدك الحالي</Text>
            <Text style={styles.balanceValue}>{(provider?.walletBalance || 0).toFixed(2)} د.أ</Text>
            <TouchableOpacity
              style={styles.topupBtn}
              onPress={() => setShowTopupModal(true)}
            >
              <Feather name="plus-circle" size={16} color={colors.primary} />
              <Text style={[styles.topupBtnText, { color: colors.primary }]}>طلب شحن رصيد</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            طلبات الشحن تحتاج موافقة الإدارة قبل الإضافة
          </Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>كشف الحساب</Text>
          {txs.map((tx) => (
            <View key={tx.id} style={[styles.txRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.txIconCircle, { backgroundColor: (tx.type === "credit" ? colors.success : colors.destructive) + "20" }]}>
                <Feather
                  name={tx.type === "credit" ? "arrow-down-left" : "arrow-up-right"}
                  size={16}
                  color={tx.type === "credit" ? colors.success : colors.destructive}
                />
              </View>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
                <Text style={[styles.txDate, { color: colors.mutedForeground }]}>{tx.date}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.type === "credit" ? colors.success : colors.destructive }]}>
                {tx.type === "credit" ? "+" : "-"}{tx.amount.toFixed(2)} د.أ
              </Text>
            </View>
          ))}
          {txs.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="credit-card" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد معاملات بعد</Text>
            </View>
          )}
        </>
      )}

      {tab === "notifications" && (
        <>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={[styles.markAllBtn, { borderColor: colors.border }]}
              onPress={() => user && markAllRead(user.id)}
            >
              <Feather name="check-square" size={14} color={colors.primary} />
              <Text style={[styles.markAllText, { color: colors.primary }]}>تحديد الكل كمقروء</Text>
            </TouchableOpacity>
          )}
          {myNotifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.notifCard, {
                backgroundColor: n.isRead ? colors.card : colors.primary + "08",
                borderColor: n.isRead ? colors.border : colors.primary + "40",
              }]}
              onPress={() => markNotificationRead(n.id)}
            >
              <View style={styles.notifContent}>
                <Text style={[styles.notifTitle, { color: colors.foreground }]}>{n.title}</Text>
                <Text style={[styles.notifBody, { color: colors.mutedForeground }]}>{n.body}</Text>
                <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                  {toHijriShort(n.createdAt)}
                </Text>
              </View>
              {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          ))}
          {myNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <Feather name="bell-off" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>لا توجد إشعارات</Text>
            </View>
          )}
        </>
      )}

      {tab === "packages" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              style={[styles.addSvcBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setPkgName(""); setPkgDesc(""); setPkgPrice(""); setPkgDuration(""); setPkgSessions(""); setPkgError(""); setShowAddPackage(true); }}
            >
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.addSvcBtnText}>باقة جديدة</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>باقات الخدمات</Text>
          </View>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            أضف باقات مجمّعة بسعر خاص (مثال: باقة العروس، 3 جلسات شعر)
          </Text>
          {myPackages.length === 0 && (
            <View style={[styles.emptyCustom, { borderColor: colors.border }]}>
              <Feather name="package" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyCustomText, { color: colors.mutedForeground }]}>لا توجد باقات بعد — أضف أول باقة</Text>
            </View>
          )}
          {myPackages.map((pkg: any) => (
            <View key={pkg.id} style={[styles.customSvcRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.deleteSvcBtn, { backgroundColor: colors.destructive + "20" }]}
                onPress={() => setPkgDeleteId(pkg.id)}
              >
                <Feather name="trash-2" size={14} color={colors.destructive} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "flex-end", gap: 4 }}>
                <Text style={[styles.customSvcName, { color: colors.foreground }]}>{pkg.title}</Text>
                {pkg.description ? <Text style={[styles.customSvcDesc, { color: colors.mutedForeground }]}>{pkg.description}</Text> : null}
                <View style={styles.customSvcMeta}>
                  {pkg.sessionsCount && <Text style={[styles.customSvcDur, { color: colors.mutedForeground }]}>{pkg.sessionsCount} جلسة</Text>}
                  {pkg.durationMinutes && <Text style={[styles.customSvcDur, { color: colors.mutedForeground }]}>{pkg.durationMinutes} دقيقة</Text>}
                  <Text style={[styles.customSvcPrice, { color: colors.primary }]}>{pkg.price} د.أ</Text>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {tab === "schedule" && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.foreground, textAlign: "right" }]}>ساعات الدوام الأسبوعي</Text>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            حددي أيام وساعات عملك — ستُعرض للعملاء عند حجز الخدمة
          </Text>
          {DAY_KEYS.map((dayKey, idx) => (
            <View key={dayKey} style={[styles.customSvcRow, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: "row-reverse", alignItems: "center", gap: 10 }]}>
              <TouchableOpacity
                style={[{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: scheduleHours[idx]?.isWorking ? colors.primary : colors.border, backgroundColor: scheduleHours[idx]?.isWorking ? colors.primary : "transparent", alignItems: "center", justifyContent: "center" }]}
                onPress={() => toggleDay(idx)}
              >
                {scheduleHours[idx]?.isWorking && <Feather name="check" size={14} color="#fff" />}
              </TouchableOpacity>
              <Text style={{ width: 52, fontSize: 13, fontFamily: "Inter_700Bold", color: scheduleHours[idx]?.isWorking ? colors.foreground : colors.mutedForeground, textAlign: "right" }}>{DAY_NAMES[idx]}</Text>
              {scheduleHours[idx]?.isWorking ? (
                <View style={{ flex: 1, flexDirection: "row-reverse", alignItems: "center", gap: 8 }}>
                  <TextInput
                    value={scheduleHours[idx]?.from || "09:00"}
                    onChangeText={(v) => setDayTime(idx, "from", v)}
                    style={{ flex: 1, textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, backgroundColor: colors.muted, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.border }}
                    placeholder="09:00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>إلى</Text>
                  <TextInput
                    value={scheduleHours[idx]?.to || "18:00"}
                    onChangeText={(v) => setDayTime(idx, "to", v)}
                    style={{ flex: 1, textAlign: "center", fontSize: 13, fontFamily: "Inter_500Medium", color: colors.foreground, backgroundColor: colors.muted, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 8, borderWidth: 1, borderColor: colors.border }}
                    placeholder="18:00"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numbers-and-punctuation"
                  />
                  <Text style={{ color: colors.mutedForeground, fontSize: 12 }}>من</Text>
                </View>
              ) : (
                <Text style={{ flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center" }}>إجازة</Text>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={[styles.addSvcBtn, { backgroundColor: colors.primary, alignSelf: "flex-end", paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 }]}
            onPress={saveSchedule}
          >
            <Feather name="check" size={14} color="#fff" />
            <Text style={styles.addSvcBtnText}>حفظ المواعيد</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === "portfolio" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <TouchableOpacity
              style={[styles.addSvcBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setPortfolioUrl(""); setPortfolioCaption(""); setShowPortfolioAdd(true); }}
            >
              <Feather name="plus" size={14} color="#fff" />
              <Text style={styles.addSvcBtnText}>إضافة صورة</Text>
            </TouchableOpacity>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>معرض أعمالي</Text>
          </View>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            أضف صور أعمالك السابقة — ستظهر للعملاء في عروضك
          </Text>
          {myPortfolio.length === 0 && (
            <View style={[styles.emptyCustom, { borderColor: colors.border }]}>
              <Feather name="image" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyCustomText, { color: colors.mutedForeground }]}>لا توجد صور بعد — أضف أولى أعمالك</Text>
            </View>
          )}
          {myPortfolio.map((photo: any) => (
            <View key={photo.id} style={[styles.customSvcRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.deleteSvcBtn, { backgroundColor: colors.destructive + "20" }]}
                onPress={() => setPortfolioRemoveId(photo.id)}
              >
                <Feather name="trash-2" size={14} color={colors.destructive} />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "flex-end", gap: 4 }}>
                {photo.caption ? <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" }}>{photo.caption}</Text> : null}
                <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>{photo.uploadedAt}</Text>
              </View>
              <Image
                source={{ uri: photo.uri }}
                style={{ width: 64, height: 64, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary + "60" }}
                resizeMode="cover"
              />
            </View>
          ))}
        </>
      )}

      <Modal
        visible={showAddSvcModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSvcModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowAddSvcModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة خدمة مخصصة</Text>
            </View>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>اسم الخدمة *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              value={newSvcName}
              onChangeText={setNewSvcName}
              placeholder="مثال: مساج استرخاء..."
              placeholderTextColor={colors.mutedForeground}
              textAlign="right"
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>الوصف</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
              value={newSvcDesc}
              onChangeText={setNewSvcDesc}
              placeholder="وصف مختصر للخدمة..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={2}
              textAlign="right"
            />
            <View style={styles.addSvcPriceRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>المدة (دقيقة)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                  value={newSvcDuration}
                  onChangeText={setNewSvcDuration}
                  keyboardType="numeric"
                  placeholder="60"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="right"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>السعر (د.أ) *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                  value={newSvcPrice}
                  onChangeText={setNewSvcPrice}
                  keyboardType="numeric"
                  placeholder="150"
                  placeholderTextColor={colors.mutedForeground}
                  textAlign="right"
                />
              </View>
            </View>
            {addSvcError !== "" && (
              <Text style={{ color: colors.destructive, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular" }}>{addSvcError}</Text>
            )}
            <TouchableOpacity
              style={[styles.topupSubmitBtn, { backgroundColor: colors.primary, opacity: newSvcName.trim() && newSvcPrice ? 1 : 0.5 }]}
              onPress={handleAddCustomSvc}
              disabled={!newSvcName.trim() || !newSvcPrice}
            >
              <Feather name="plus-circle" size={18} color="#fff" />
              <Text style={styles.topupSubmitText}>إضافة الخدمة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showTopupModal} transparent animationType="slide" onRequestClose={handleCloseTopup}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCloseTopup}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={handleCloseTopup}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>طلب شحن رصيد</Text>
              </View>
              {topupSuccess ? (
                <View style={{ alignItems: "center", gap: 16, paddingVertical: 20 }}>
                  <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "#4caf50" + "20", alignItems: "center", justifyContent: "center" }}>
                    <Feather name="check-circle" size={32} color="#4caf50" />
                  </View>
                  <Text style={{ color: colors.foreground, fontSize: 18, fontFamily: "Inter_700Bold" }}>تم الإرسال!</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" }}>
                    تم إرسال طلب شحن الرصيد للإدارة. ستُعلَم فور الموافقة.
                  </Text>
                  <TouchableOpacity style={[styles.topupSubmitBtn, { backgroundColor: colors.primary }]} onPress={handleCloseTopup}>
                    <Text style={styles.topupSubmitText}>حسناً</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
                    سيتم مراجعة طلبك من قبل الإدارة وإشعارك فور الموافقة
                  </Text>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>المبلغ المطلوب (د.أ) *</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: topupError ? colors.destructive : colors.border }]}
                    value={topupAmount}
                    onChangeText={(t) => { setTopupAmount(t); setTopupError(""); }}
                    keyboardType="numeric"
                    placeholder="مثال: 500"
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="right"
                  />
                  {topupError !== "" && (
                    <Text style={{ color: colors.destructive, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular" }}>{topupError}</Text>
                  )}
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>ملاحظة (اختياري)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                    value={topupNote}
                    onChangeText={setTopupNote}
                    placeholder="تفاصيل إضافية..."
                    placeholderTextColor={colors.mutedForeground}
                    multiline
                    numberOfLines={2}
                    textAlign="right"
                  />
                  <TouchableOpacity style={[styles.topupSubmitBtn, { backgroundColor: colors.primary }]} onPress={handleTopupRequest}>
                    <Feather name="send" size={18} color="#fff" />
                    <Text style={styles.topupSubmitText}>إرسال الطلب</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showLogoutConfirm} transparent animationType="fade" onRequestClose={() => setShowLogoutConfirm(false)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setShowLogoutConfirm(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Feather name="log-out" size={28} color={colors.destructive} style={{ alignSelf: "center" }} />
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>تسجيل الخروج</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>هل أنت متأكدة من تسجيل الخروج؟</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmCancel, { borderColor: colors.border }]} onPress={() => setShowLogoutConfirm(false)}>
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmDelete, { backgroundColor: colors.destructive }]} onPress={handleLogoutConfirm}>
                <Text style={styles.confirmDeleteText}>خروج</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showEditProfile} transparent animationType="slide" onRequestClose={() => setShowEditProfile(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowEditProfile(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>تعديل الملف الشخصي</Text>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>نبذة تعريفية</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border, minHeight: 80, textAlignVertical: "top" }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="اكتبي نبذة مختصرة عن خبرتك وتخصصاتك..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={3}
                textAlign="right"
              />
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>العنوان / المنطقة</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                value={editLocation}
                onChangeText={setEditLocation}
                placeholder="مثال: الرياض، حي النزهة"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
              <TouchableOpacity style={[styles.topupSubmitBtn, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                <Feather name="save" size={18} color="#fff" />
                <Text style={styles.topupSubmitText}>حفظ التغييرات</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!deleteConfirmId} transparent animationType="fade" onRequestClose={() => setDeleteConfirmId(null)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setDeleteConfirmId(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>حذف الخدمة</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>
              هل تريدين حذف هذه الخدمة المخصصة؟ لا يمكن التراجع.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmCancel, { borderColor: colors.border }]} onPress={() => setDeleteConfirmId(null)}>
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, { backgroundColor: colors.destructive }]}
                onPress={() => { if (deleteConfirmId) deleteCustomProviderService(deleteConfirmId); setDeleteConfirmId(null); }}
              >
                <Text style={styles.confirmDeleteText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showPhoneEditModal} transparent animationType="slide" onRequestClose={() => setShowPhoneEditModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPhoneEditModal(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPhoneEditModal(false)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>تعديل رقم الهاتف</Text>
              </View>
              {phoneSubmitSuccess ? (
                <View style={{ alignItems: "center", gap: 16, paddingVertical: 16 }}>
                  <Feather name="clock" size={40} color="#ff9800" />
                  <Text style={{ color: colors.foreground, fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" }}>طلبك قيد المراجعة</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 }}>
                    تم إرسال طلب تغيير الرقم للإدارة. ستُعلَمين بالنتيجة خلال 24 ساعة.
                  </Text>
                  <TouchableOpacity style={[styles.topupSubmitBtn, { backgroundColor: colors.primary }]} onPress={() => setShowPhoneEditModal(false)}>
                    <Text style={styles.topupSubmitText}>موافق</Text>
                  </TouchableOpacity>
                </View>
              ) : !otpSent ? (
                <>
                  <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
                    أدخل الرقم الجديد — سيُرسل رمز OTP للتحقق قبل إرسال الطلب للإدارة
                  </Text>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>رقم الهاتف الجديد</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                    value={newPhone}
                    onChangeText={setNewPhone}
                    placeholder="0791234567"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                    textAlign="right"
                  />
                  <TouchableOpacity
                    style={[styles.topupSubmitBtn, { backgroundColor: colors.primary, opacity: newPhone.trim() ? 1 : 0.5 }]}
                    disabled={!newPhone.trim()}
                    onPress={() => { setOtpSent(true); setOtpValue(""); setOtpError(""); }}
                  >
                    <Feather name="send" size={18} color="#fff" />
                    <Text style={styles.topupSubmitText}>إرسال رمز التحقق</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={{ backgroundColor: colors.success + "15", borderRadius: 12, padding: 12, marginBottom: 4 }}>
                    <Text style={{ color: colors.success, fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "center" }}>
                      📱 تم إرسال رمز OTP إلى {newPhone}
                    </Text>
                    <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 }}>
                      (للتجربة: الرمز هو 1234)
                    </Text>
                  </View>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>رمز التحقق</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: otpError ? colors.destructive : colors.border, fontSize: 24, textAlign: "center", letterSpacing: 8 }]}
                    value={otpValue}
                    onChangeText={setOtpValue}
                    placeholder="_ _ _ _"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  {otpError ? <Text style={{ color: colors.destructive, fontSize: 13, textAlign: "center", fontFamily: "Inter_400Regular" }}>{otpError}</Text> : null}
                  <TouchableOpacity
                    style={[styles.topupSubmitBtn, { backgroundColor: colors.primary, opacity: otpValue.length === 4 ? 1 : 0.5 }]}
                    disabled={otpValue.length !== 4}
                    onPress={() => {
                      if (otpValue !== "1234") { setOtpError("رمز التحقق غير صحيح، حاولي مجدداً"); return; }
                      if (!provider || !user) return;
                      submitProfileChangeRequest(provider.id, { phone: newPhone.trim() });
                      setPhoneSubmitSuccess(true);
                    }}
                  >
                    <Feather name="check-circle" size={18} color="#fff" />
                    <Text style={styles.topupSubmitText}>تأكيد وإرسال للإدارة</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setOtpSent(false)} style={{ alignItems: "center", paddingVertical: 8 }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular" }}>تغيير الرقم ← إعادة الإرسال</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showAddPackage} transparent animationType="slide" onRequestClose={() => setShowAddPackage(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowAddPackage(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowAddPackage(false)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة باقة جديدة</Text>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>اسم الباقة *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                value={pkgName}
                onChangeText={setPkgName}
                placeholder="مثال: باقة العروس الشاملة"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>الوصف</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                value={pkgDesc}
                onChangeText={setPkgDesc}
                placeholder="ما تشمله الباقة..."
                placeholderTextColor={colors.mutedForeground}
                multiline
                numberOfLines={2}
                textAlign="right"
              />
              <View style={styles.addSvcPriceRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>عدد الجلسات</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                    value={pkgSessions}
                    onChangeText={setPkgSessions}
                    keyboardType="numeric"
                    placeholder="3"
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="right"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>المدة (دقيقة)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                    value={pkgDuration}
                    onChangeText={setPkgDuration}
                    keyboardType="numeric"
                    placeholder="120"
                    placeholderTextColor={colors.mutedForeground}
                    textAlign="right"
                  />
                </View>
              </View>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>السعر الإجمالي (د.أ) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                value={pkgPrice}
                onChangeText={setPkgPrice}
                keyboardType="numeric"
                placeholder="350"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
              {pkgError ? <Text style={{ color: colors.destructive, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular" }}>{pkgError}</Text> : null}
              <TouchableOpacity
                style={[styles.topupSubmitBtn, { backgroundColor: colors.primary, opacity: pkgName.trim() && pkgPrice ? 1 : 0.5 }]}
                disabled={!pkgName.trim() || !pkgPrice}
                onPress={() => {
                  const price = parseFloat(pkgPrice);
                  if (isNaN(price) || price <= 0) { setPkgError("يرجى إدخال سعر صحيح"); return; }
                  if (!user) return;
                  addPackage({
                    providerId: user.id,
                    providerName: user.name,
                    title: pkgName.trim(),
                    description: pkgDesc.trim(),
                    price,
                    originalPrice: price,
                    serviceIds: [],
                    serviceNames: [],
                    durationMinutes: parseInt(pkgDuration) || undefined,
                    sessionsCount: parseInt(pkgSessions) || undefined,
                  });
                  setShowAddPackage(false);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Feather name="package" size={18} color="#fff" />
                <Text style={styles.topupSubmitText}>حفظ الباقة</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!pkgDeleteId} transparent animationType="fade" onRequestClose={() => setPkgDeleteId(null)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setPkgDeleteId(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>حذف الباقة</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>هل تريدين حذف هذه الباقة نهائياً؟</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmCancel, { borderColor: colors.border }]} onPress={() => setPkgDeleteId(null)}>
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, { backgroundColor: colors.destructive }]}
                onPress={() => { if (pkgDeleteId) deletePackage(pkgDeleteId); setPkgDeleteId(null); }}
              >
                <Text style={styles.confirmDeleteText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showPortfolioAdd} transparent animationType="slide" onRequestClose={() => setShowPortfolioAdd(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPortfolioAdd(false)}>
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modal, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPortfolioAdd(false)}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>إضافة صورة لمعرض الأعمال</Text>
              </View>
              <Text style={[styles.modalDesc, { color: colors.mutedForeground }]}>
                اختر صورة من استوديو هاتفك — ستظهر للعملاء في عروضك
              </Text>

              <TouchableOpacity
                style={[styles.topupSubmitBtn, { backgroundColor: colors.primary + "15", borderWidth: 1, borderColor: colors.primary + "40", marginBottom: 8 }]}
                onPress={pickPortfolioPhoto}
              >
                <Feather name="camera" size={18} color={colors.primary} />
                <Text style={{ color: colors.primary, fontSize: 15, fontFamily: "Inter_700Bold" }}>اختيار من الاستوديو</Text>
              </TouchableOpacity>

              {pickedPortfolioUri ? (
                <View style={{ alignItems: "center", marginBottom: 8 }}>
                  <Image source={{ uri: pickedPortfolioUri }} style={{ width: 120, height: 120, borderRadius: 14, borderWidth: 2, borderColor: colors.primary }} />
                  <Text style={{ color: colors.primary, fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 6 }}>✓ تم اختيار الصورة</Text>
                </View>
              ) : null}

              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>تعليق (اختياري)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                value={portfolioCaption}
                onChangeText={setPortfolioCaption}
                placeholder="مثال: قص وصبغ شعر العروس"
                placeholderTextColor={colors.mutedForeground}
                textAlign="right"
              />
              <TouchableOpacity
                style={[styles.topupSubmitBtn, { backgroundColor: colors.primary, opacity: pickedPortfolioUri ? 1 : 0.4 }]}
                disabled={!pickedPortfolioUri}
                onPress={() => {
                  if (!provider || !pickedPortfolioUri) return;
                  addPortfolioPhoto(provider.id, pickedPortfolioUri, portfolioCaption.trim() || undefined);
                  setShowPortfolioAdd(false);
                  setPickedPortfolioUri(null);
                  setPortfolioCaption("");
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
              >
                <Feather name="image" size={18} color="#fff" />
                <Text style={styles.topupSubmitText}>إضافة للمعرض</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!portfolioRemoveId} transparent animationType="fade" onRequestClose={() => setPortfolioRemoveId(null)}>
        <TouchableOpacity style={styles.confirmOverlay} activeOpacity={1} onPress={() => setPortfolioRemoveId(null)}>
          <TouchableOpacity activeOpacity={1} style={[styles.confirmBox, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.confirmTitle, { color: colors.foreground }]}>إزالة الصورة</Text>
            <Text style={[styles.confirmMsg, { color: colors.mutedForeground }]}>هل تريدين إزالة هذه الصورة من معرض أعمالك؟</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={[styles.confirmCancel, { borderColor: colors.border }]} onPress={() => setPortfolioRemoveId(null)}>
                <Text style={[styles.confirmCancelText, { color: colors.foreground }]}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDelete, { backgroundColor: colors.destructive }]}
                onPress={() => { if (portfolioRemoveId && provider) removePortfolioPhoto(provider.id, portfolioRemoveId); setPortfolioRemoveId(null); }}
              >
                <Text style={styles.confirmDeleteText}>إزالة</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, colors }: any) {
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      <View style={styles.infoLabel}>
        <Text style={[styles.infoLabelText, { color: colors.mutedForeground }]}>{label}</Text>
        <Feather name={icon} size={16} color={colors.primary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", textAlign: "right" },
  heroCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  avatar: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 28, fontFamily: "Inter_700Bold" },
  avatarEditBadge: { position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#fff" },
  providerName: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold" },
  badges: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  statsRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 14, width: "100%", justifyContent: "space-around", marginTop: 4 },
  stat: { alignItems: "center", gap: 4 },
  statVal: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  statLab: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular" },
  statDiv: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  suspensionBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  suspensionTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  suspensionReason: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, marginHorizontal: -20, paddingHorizontal: 10 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 12, paddingHorizontal: 4 },
  tabBtnText: { fontSize: 11 },
  availabilityCard: { borderRadius: 16, padding: 16, borderWidth: 1 },
  availabilityRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  availLabel: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  availDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  infoCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 4 },
  infoTitle: { fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  infoLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoLabelText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  infoValue: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1, marginStart: 12 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, borderWidth: 1.5, gap: 10 },
  logoutText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  searchBar: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  sectionNote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  serviceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 14, borderWidth: 1, gap: 10 },
  serviceRight: { alignItems: "flex-start", gap: 4 },
  servicePriceArea: { alignItems: "flex-start", gap: 2 },
  serviceCustomPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  serviceDuration: { fontSize: 11, fontFamily: "Inter_400Regular" },
  serviceName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  serviceDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  balanceCard: { borderRadius: 20, padding: 24, alignItems: "center", gap: 8 },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  balanceValue: { color: "#fff", fontSize: 36, fontFamily: "Inter_700Bold" },
  topupBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 },
  topupBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  txIconCircle: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  txDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold", minWidth: 80, textAlign: "left" },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  notifCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 14, borderWidth: 1 },
  notifContent: { flex: 1, alignItems: "flex-end", gap: 4 },
  notifTitle: { fontSize: 14, fontFamily: "Inter_700Bold" },
  notifBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right" },
  notifTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginLeft: 8 },
  markAllBtn: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, justifyContent: "center" },
  markAllText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  fieldLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  input: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  topupSubmitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 14, gap: 10, marginTop: 4 },
  topupSubmitText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  bioCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  bioTitle: { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  bioText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 20 },
  infoCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  editProfileBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  editProfileBtnText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  confirmBox: { borderRadius: 20, padding: 24, width: "100%", gap: 12 },
  confirmTitle: { fontSize: 18, fontFamily: "Inter_700Bold", textAlign: "center" },
  confirmMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  confirmCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  confirmCancelText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  confirmDelete: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center" },
  confirmDeleteText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  customSvcHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  customSvcTitle: { fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  addSvcBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addSvcBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyCustom: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  emptyCustomText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  customSvcRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
  deleteSvcBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  radiusChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  customSvcNameRow: { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "flex-end" },
  customBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  customBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  customSvcName: { fontSize: 14, fontFamily: "Inter_700Bold" },
  customSvcDesc: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", lineHeight: 18 },
  customSvcMeta: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "flex-end", marginTop: 4 },
  customSvcPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  customSvcDur: { fontSize: 12, fontFamily: "Inter_400Regular" },
  addSvcPriceRow: { flexDirection: "row", gap: 12 },
});
