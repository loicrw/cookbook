import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppDataProvider } from "@/src/context/AppDataContext";
import { NoticeProvider } from "@/src/context/NoticeContext";
import { theme } from "@/src/styles/common";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppDataProvider>
        <NoticeProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: theme.surface },
              headerTintColor: theme.text,
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </NoticeProvider>
      </AppDataProvider>
    </SafeAreaProvider>
  );
}
