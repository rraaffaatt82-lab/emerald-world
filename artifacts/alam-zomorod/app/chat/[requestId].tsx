import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";

const ARABIC_NUMS = ["صفر", "واحد", "اثنين", "اثنان", "ثلاثة", "أربعة", "اربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة"];

function containsPhonePattern(text: string): boolean {
  if (/\d{4,}/.test(text)) return true;
  const escaped = ARABIC_NUMS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const wordPat = new RegExp(`(${escaped.join("|")})\\s+(${escaped.join("|")})\\s+(${escaped.join("|")})\\s+(${escaped.join("|")})`);
  if (wordPat.test(text)) return true;
  if (/(\b\d\b\s*){4,}/.test(text)) return true;
  return false;
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requests, getChatMessages, sendMessage, markChatRead } = useData();
  const params = useLocalSearchParams<{ requestId: string; chatKey?: string; partnerName?: string }>();
  const requestId = params.requestId;
  const chatKey = params.chatKey || requestId;
  const [text, setText] = useState("");
  const [blocked, setBlocked] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const isWeb = Platform.OS === "web";
  const webTopPad = isWeb ? 67 : 0;

  const request = requests.find((r) => r.id === requestId);
  const messages = getChatMessages(chatKey || "");

  const isCustomer = user?.role === "customer";
  const partnerName = params.partnerName || (isCustomer ? request?.providerName : request?.customerName);

  useEffect(() => {
    if (chatKey && user?.id) markChatRead(chatKey, user.id);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  function handleSend() {
    if (!text.trim() || !user || !chatKey) return;
    if (containsPhonePattern(text.trim())) {
      setBlocked(true);
      setTimeout(() => setBlocked(false), 3000);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(chatKey, user.id, user.name, user.role as "customer" | "provider", text.trim());
    setText("");
    setBlocked(false);
  }

  function formatTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.bottom + 20}
    >
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top + webTopPad }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.foreground }]}>{partnerName || "المحادثة"}</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>{request?.serviceName}</Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: "#4caf50" }]} />
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        ListEmptyComponent={() => (
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyChatText, { color: colors.mutedForeground }]}>ابدئي المحادثة مع {partnerName}</Text>
          </View>
        )}
        renderItem={({ item }) => {
          const isMine = item.senderId === user?.id;
          return (
            <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
              {!isMine && (
                <View style={[styles.msgAvatar, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.msgAvatarText, { color: colors.primary }]}>{item.senderName[0]}</Text>
                </View>
              )}
              <View style={[
                styles.bubble,
                isMine
                  ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 },
              ]}>
                <Text style={[styles.bubbleText, { color: isMine ? "#fff" : colors.foreground }]}>{item.text}</Text>
                <Text style={[styles.bubbleTime, { color: isMine ? "rgba(255,255,255,0.65)" : colors.mutedForeground }]}>
                  {formatTime(item.sentAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View style={[
        styles.inputBar,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + (isWeb ? 34 : 8),
        },
      ]}>
        <View style={{ flex: 1, gap: 4 }}>
          {blocked && (
            <View style={{ backgroundColor: "#f44336" + "15", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#f44336" + "40" }}>
              <Text style={{ color: "#f44336", fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "right" }}>
                ⚠️ لا يمكن مشاركة أرقام الهاتف في المحادثة
              </Text>
            </View>
          )}
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: blocked ? "#f44336" : colors.border }]}
            placeholder="اكتبي رسالتك..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={(v) => { setText(v); if (blocked) setBlocked(false); }}
            multiline
            textAlign="right"
            onSubmitEditing={handleSend}
          />
        </View>
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
          onPress={handleSend}
          disabled={!text.trim()}
        >
          <Feather name="send" size={18} color={text.trim() ? "#fff" : colors.mutedForeground} style={{ transform: [{ scaleX: -1 }] }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 14, gap: 12, borderBottomWidth: 1 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1, alignItems: "flex-end" },
  headerName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 14, fontFamily: "Inter_400Regular" },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  list: { padding: 16, gap: 10 },
  emptyChat: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyChatText: { fontSize: 16, fontFamily: "Inter_400Regular", textAlign: "center" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 3 },
  msgRowRight: { flexDirection: "row-reverse" },
  msgRowLeft: {},
  msgAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  msgAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  bubble: { maxWidth: "78%", paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, gap: 4 },
  bubbleText: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24 },
  bubbleTime: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "left" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 24, borderWidth: 1, paddingHorizontal: 18, paddingVertical: 12, fontSize: 16, fontFamily: "Inter_400Regular", maxHeight: 120 },
  sendBtn: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
});
