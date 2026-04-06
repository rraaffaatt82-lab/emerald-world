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

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requests, getChatMessages, sendMessage, markChatRead } = useData();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [text, setText] = useState("");
  const flatRef = useRef<FlatList>(null);
  const isWeb = Platform.OS === "web";
  const webTopPad = isWeb ? 67 : 0;

  const request = requests.find((r) => r.id === requestId);
  const messages = getChatMessages(requestId || "");

  const isCustomer = user?.role === "customer";
  const partnerName = isCustomer ? request?.providerName : request?.customerName;

  useEffect(() => {
    if (requestId && user?.id) markChatRead(requestId, user.id);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  function handleSend() {
    if (!text.trim() || !user || !requestId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMessage(requestId, user.id, user.name, user.role as "customer" | "provider", text.trim());
    setText("");
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
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
          placeholder="اكتبي رسالتك..."
          placeholderTextColor={colors.mutedForeground}
          value={text}
          onChangeText={setText}
          multiline
          textAlign="right"
          onSubmitEditing={handleSend}
        />
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
  headerName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  list: { padding: 16, gap: 10 },
  emptyChat: { alignItems: "center", marginTop: 80, gap: 12 },
  emptyChatText: { fontSize: 15, fontFamily: "Inter_400Regular", textAlign: "center" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 3 },
  msgRowRight: { flexDirection: "row-reverse" },
  msgRowLeft: {},
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  msgAvatarText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  bubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, gap: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  bubbleTime: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "left" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 14, paddingTop: 10, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
