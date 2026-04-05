import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useData, CATEGORIES, SERVICES } from "@/context/DataContext";
import { STRINGS } from "@/constants/strings";
import { ServiceCard } from "@/components/ui/ServiceCard";

export default function CategoriesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ catId?: string }>();
  const [selectedCat, setSelectedCat] = useState(params.catId || CATEGORIES[0].id);
  const webTopPad = Platform.OS === "web" ? 67 : 0;
  const webBottomPad = Platform.OS === "web" ? 34 : 0;

  const category = CATEGORIES.find((c) => c.id === selectedCat)!;
  const services = SERVICES.filter((s) => s.categoryId === selectedCat);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + webTopPad + 10,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {STRINGS.tabs.categories}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.catTabs, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.catTabsContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.catTab,
              selectedCat === cat.id && {
                backgroundColor: cat.color,
                borderColor: cat.color,
              },
              selectedCat !== cat.id && {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => setSelectedCat(cat.id)}
          >
            <Feather
              name={cat.icon as any}
              size={16}
              color={selectedCat === cat.id ? "#fff" : colors.mutedForeground}
            />
            <Text
              style={[
                styles.catTabText,
                {
                  color: selectedCat === cat.id ? "#fff" : colors.mutedForeground,
                },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={services}
        keyExtractor={(i) => i.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + webBottomPad + 90 },
        ]}
        ListHeaderComponent={() => (
          <View style={styles.catHeader}>
            <View style={[styles.catIconLarge, { backgroundColor: category.color + "20" }]}>
              <Feather name={category.icon as any} size={30} color={category.color} />
            </View>
            <View>
              <Text style={[styles.catName, { color: colors.foreground }]}>
                {category.name}
              </Text>
              <Text style={[styles.catCount, { color: colors.mutedForeground }]}>
                {services.length} خدمة متاحة
              </Text>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <ServiceCard
            service={item}
            categoryColor={category.color}
            onOrder={() =>
              router.push({
                pathname: "/request-service",
                params: { serviceId: item.id },
              })
            }
          />
        )}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              لا توجد خدمات في هذه الفئة
            </Text>
          </View>
        )}
        scrollEnabled={services.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  catTabs: {
    borderBottomWidth: 1,
    flexGrow: 0,
  },
  catTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  catTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  catTabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  catHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
    justifyContent: "flex-start",
  },
  catIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "right",
  },
  catCount: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
