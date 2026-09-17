import { PremiumProvider } from "@/state/PremiumProvider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PremiumProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#020617" },
            headerTintColor: "#f1f5f9",
            headerTitleStyle: { fontWeight: "800" },
            contentStyle: { backgroundColor: "#020617" },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen
            name="season/[seasonId]/index"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="season/[seasonId]/setup-match"
            options={{ title: "Match Setup" }}
          />
          <Stack.Screen
            name="season/[seasonId]/teams"
            options={{ title: "Teams" }}
          />
          <Stack.Screen
            name="season/[seasonId]/match/[matchId]"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="season/[seasonId]/storage"
            options={{ title: "Storage Management" }}
          />
        </Stack>
      </PremiumProvider>
    </SafeAreaProvider>
  );
}
