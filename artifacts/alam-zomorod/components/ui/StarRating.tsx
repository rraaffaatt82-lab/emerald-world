import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: number;
  onRate?: (rating: number) => void;
  interactive?: boolean;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 16,
  onRate,
  interactive = false,
}: StarRatingProps) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {Array.from({ length: maxRating }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        if (interactive) {
          return (
            <TouchableOpacity key={i} onPress={() => onRate?.(i + 1)}>
              <Feather
                name="star"
                size={size}
                color={filled || half ? colors.accent : colors.border}
                style={{ marginHorizontal: 2 }}
              />
            </TouchableOpacity>
          );
        }
        return (
          <Feather
            key={i}
            name="star"
            size={size}
            color={filled || half ? colors.accent : colors.border}
            style={{ marginHorizontal: 1 }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
