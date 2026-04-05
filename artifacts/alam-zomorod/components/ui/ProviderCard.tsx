import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Provider } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { StarRating } from "./StarRating";
import { Badge } from "./Badge";

interface ProviderCardProps {
  provider: Provider;
  onPress?: () => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
  compact?: boolean;
}

export function ProviderCard({
  provider,
  onPress,
  isFavorite,
  onFavorite,
  compact,
}: ProviderCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        compact && styles.compact,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="user" size={compact ? 20 : 26} color={colors.primary} />
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text
              style={[
                styles.name,
                { color: colors.foreground, fontSize: compact ? 14 : 16 },
              ]}
              numberOfLines={1}
            >
              {provider.name}
            </Text>
            {provider.isVerified && (
              <Feather name="check-circle" size={14} color={colors.primary} style={{ marginStart: 4 }} />
            )}
          </View>
          <View style={styles.row}>
            <StarRating rating={provider.rating} size={12} />
            <Text style={[styles.rating, { color: colors.mutedForeground }]}>
              {" "}
              {provider.rating} ({provider.reviewsCount})
            </Text>
          </View>
          <View style={styles.row}>
            <Feather name="map-pin" size={12} color={colors.mutedForeground} />
            <Text style={[styles.distance, { color: colors.mutedForeground }]}>
              {" "}
              {provider.distance} {STRINGS.home.km}
            </Text>
            <Badge
              label={provider.type === "salon" ? STRINGS.auth.salon : STRINGS.auth.freelancer}
              style={{ marginStart: 8 }}
              variant={provider.type === "salon" ? "default" : "accent"}
            />
          </View>
        </View>
        <View style={styles.actions}>
          {onFavorite && (
            <TouchableOpacity onPress={onFavorite} style={styles.favBtn}>
              <Feather
                name="heart"
                size={18}
                color={isFavorite ? colors.destructive : colors.mutedForeground}
              />
            </TouchableOpacity>
          )}
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: provider.isAvailable
                  ? colors.success
                  : colors.mutedForeground,
              },
            ]}
          />
        </View>
      </View>
      {!compact && (
        <Text style={[styles.bio, { color: colors.mutedForeground }]} numberOfLines={2}>
          {provider.bio}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  compact: {
    padding: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginEnd: 12,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontFamily: "Inter_600SemiBold",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  distance: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    alignItems: "flex-end",
    gap: 6,
  },
  favBtn: {
    padding: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bio: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 10,
    lineHeight: 20,
  },
});
