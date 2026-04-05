import React from "react";
import { I18nManager, View } from "react-native";

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export function RTLProvider({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1, direction: "rtl" }}>{children}</View>;
}
