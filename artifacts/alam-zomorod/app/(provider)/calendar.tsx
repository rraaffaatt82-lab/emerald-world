import { Feather } from "@expo/vector-icons";
import React, { useState, useMemo } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import { toHijriShort } from "@/utils/date";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
const DAYS_AR = ["ح","ن","ث","ر","خ","ج","س"];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getAppointmentDate(scheduledAt: string) {
  return new Date(scheduledAt);
}

export default function ProviderCalendarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getRequestsByProvider, providers, updateProvider } = useData();
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [showReminderModal, setShowReminderModal] = useState(false);

  const provider = providers.find((p) => p.id === user?.id);
  const myJobs = getRequestsByProvider(user?.id || "");
  const activeJobs = myJobs.filter((r) => ["accepted", "in_progress"].includes(r.status));

  function prevMonth() {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  }

  const daysInMonth = useMemo(() => {
    const days: Date[] = [];
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    return { days, firstDayOfWeek: firstDay.getDay() };
  }, [viewYear, viewMonth]);

  const appointmentDates = useMemo(() => {
    return activeJobs.map((j) => getAppointmentDate(j.scheduledAt));
  }, [activeJobs]);

  function hasAppointment(day: Date) {
    return appointmentDates.some((d) => isSameDay(d, day));
  }

  const selectedDayJobs = activeJobs.filter((j) => {
    const d = getAppointmentDate(j.scheduledAt);
    return isSameDay(d, selectedDay);
  });

  const REMINDER_OPTIONS = [
    { label: "لا تذكير", value: 0 },
    { label: "15 دقيقة قبل", value: 15 },
    { label: "30 دقيقة قبل", value: 30 },
    { label: "ساعة قبل", value: 60 },
    { label: "ساعتان قبل", value: 120 },
    { label: "يوم كامل قبل", value: 1440 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + webTopPad + 10, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.reminderBtn, { backgroundColor: colors.accent + "15", borderColor: colors.accent + "40" }]}
          onPress={() => setShowReminderModal(true)}
        >
          <Feather name="bell" size={14} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 12, fontFamily: "Inter_600SemiBold" }}>
            {provider?.reminderMinutes && provider.reminderMinutes > 0
              ? REMINDER_OPTIONS.find((o) => o.value === provider.reminderMinutes)?.label || "تذكير"
              : "تذكير"}
          </Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>التقويم</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + webBottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Feather name="chevron-left" size={22} color={colors.foreground} />
            </TouchableOpacity>
            <View style={{ alignItems: "center" }}>
              <Text style={[styles.monthTitle, { color: colors.foreground }]}>
                {MONTHS_AR[viewMonth]} {viewYear}
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: "Inter_400Regular" }}>
                {activeJobs.length} موعد نشط
              </Text>
            </View>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekDaysRow}>
            {DAYS_AR.map((d, i) => (
              <Text key={i} style={[styles.weekDay, { color: colors.mutedForeground }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {Array.from({ length: daysInMonth.firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dayCell} />
            ))}
            {daysInMonth.days.map((day) => {
              const isToday = isSameDay(day, today);
              const isSelected = isSameDay(day, selectedDay);
              const hasAppt = hasAppointment(day);
              return (
                <TouchableOpacity
                  key={day.toISOString()}
                  style={[
                    styles.dayCell,
                    isSelected && { backgroundColor: colors.accent, borderRadius: 22 },
                    isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.accent, borderRadius: 22 },
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={[
                    styles.dayNum,
                    { color: isSelected ? "#fff" : isToday ? colors.accent : colors.foreground },
                  ]}>
                    {day.getDate()}
                  </Text>
                  {hasAppt && (
                    <View style={[styles.dot, { backgroundColor: isSelected ? "#fff" : colors.primary }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            {`مواعيد ${selectedDay.getDate()} ${MONTHS_AR[selectedDay.getMonth()]}`}
          </Text>
          {selectedDayJobs.length > 0 && (
            <View style={[styles.apptBadge, { backgroundColor: colors.accent + "20" }]}>
              <Text style={{ color: colors.accent, fontSize: 12, fontFamily: "Inter_700Bold" }}>
                {selectedDayJobs.length}
              </Text>
            </View>
          )}
        </View>

        {selectedDayJobs.length === 0 ? (
          <View style={[styles.emptyDay, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="calendar" size={36} color={colors.border} />
            <Text style={[styles.emptyDayText, { color: colors.mutedForeground }]}>لا توجد مواعيد في هذا اليوم</Text>
          </View>
        ) : (
          selectedDayJobs.map((job) => (
            <View key={job.id} style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border, borderRightWidth: 4, borderRightColor: colors.accent }]}>
              <View style={{ flex: 1, alignItems: "flex-end" }}>
                <Text style={[styles.apptService, { color: colors.foreground }]}>{job.serviceName}</Text>
                <View style={styles.apptMeta}>
                  <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.apptMetaText, { color: colors.mutedForeground }]}>{job.address}</Text>
                </View>
                <View style={styles.apptMeta}>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.apptMetaText, { color: colors.mutedForeground }]}>
                    {toHijriShort(job.scheduledAt)}
                  </Text>
                </View>
                <View style={styles.apptMeta}>
                  <Feather name="user" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.apptMetaText, { color: colors.mutedForeground }]}>{job.customerName}</Text>
                </View>
              </View>
              <View style={{ alignItems: "center", gap: 6 }}>
                <Text style={[styles.apptPrice, { color: colors.accent }]}>{job.price} د.أ</Text>
                <View style={[styles.statusBadge, {
                  backgroundColor: job.status === "in_progress" ? colors.primary + "20" : colors.success + "20",
                }]}>
                  <Text style={{ color: job.status === "in_progress" ? colors.primary : colors.success, fontSize: 11, fontFamily: "Inter_700Bold" }}>
                    {job.status === "in_progress" ? "جارٍ" : "مقبول"}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        {activeJobs.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16, marginHorizontal: 16 }]}>
              جميع المواعيد النشطة
            </Text>
            {activeJobs.map((job) => (
              <View key={job.id} style={[styles.apptCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ flex: 1, alignItems: "flex-end" }}>
                  <Text style={[styles.apptService, { color: colors.foreground }]}>{job.serviceName}</Text>
                  <View style={styles.apptMeta}>
                    <Feather name="calendar" size={12} color={colors.mutedForeground} />
                    <Text style={[styles.apptMetaText, { color: colors.mutedForeground }]}>
                      {toHijriShort(job.scheduledAt)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.apptPrice, { color: colors.primary }]}>{job.price} د.أ</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={showReminderModal} transparent animationType="slide" onRequestClose={() => setShowReminderModal(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setShowReminderModal(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: colors.card }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <TouchableOpacity onPress={() => setShowReminderModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>إعداد التذكير</Text>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "right", marginBottom: 12 }}>
              ذكّرني قبل موعد الخدمة بـ:
            </Text>
            {REMINDER_OPTIONS.map((opt) => {
              const active = (provider?.reminderMinutes ?? 60) === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.reminderOption, {
                    backgroundColor: active ? colors.accent + "15" : colors.muted,
                    borderColor: active ? colors.accent : colors.border,
                  }]}
                  onPress={() => {
                    if (provider) updateProvider(provider.id, { reminderMinutes: opt.value });
                    setShowReminderModal(false);
                  }}
                >
                  {active && <Feather name="check" size={16} color={colors.accent} />}
                  <Text style={{ color: active ? colors.accent : colors.foreground, fontSize: 15, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  reminderBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  calendarCard: { borderRadius: 18, borderWidth: 1, padding: 16 },
  monthNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  navBtn: { padding: 8 },
  monthTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  weekDaysRow: { flexDirection: "row", marginBottom: 8 },
  weekDay: { flex: 1, textAlign: "center", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayCell: { width: "14.28%", alignItems: "center", paddingVertical: 6 },
  dayNum: { fontSize: 14, fontFamily: "Inter_400Regular" },
  dot: { width: 5, height: 5, borderRadius: 3, marginTop: 2 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  apptBadge: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  emptyDay: { borderRadius: 14, borderWidth: 1, padding: 30, alignItems: "center", gap: 10 },
  emptyDayText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  apptCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  apptService: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  apptMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  apptMetaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  apptPrice: { fontSize: 16, fontFamily: "Inter_700Bold" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#ccc", alignSelf: "center", marginBottom: 8 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  reminderOption: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1 },
});
