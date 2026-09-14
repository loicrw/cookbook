import { Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/src/context/AppDataContext";
import { scaleFont, spacing, styles, theme } from "@/src/styles/common";

/**
 * Reading and editing a recipe is a stack nested inside the tab bar, so the bar
 * stays put wherever the user goes. The group is hidden from the bar itself in
 * the tabs layout.
 */
export default function RecipeLayout() {
  const { fontScale } = useSettings();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerTitleStyle: { fontSize: scaleFont(17, fontScale) },
      }}
    >
      <Stack.Screen
        name="[id]/index"
        options={{
          // The first screen of this stack has nothing to pop back to, so the
          // way back to the cookbook is spelled out here.
          headerLeft: () => <BackToRecipes />,
          title: "Recipe",
        }}
      />
      <Stack.Screen name="[id]/edit" options={{ title: "Edit recipe" }} />
    </Stack>
  );
}

function BackToRecipes() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel="Back to recipes"
      accessibilityRole="button"
      hitSlop={spacing.sm}
      // Deliberately not `back()`: popping out of this stack lands on whichever
      // tab the navigator considers first, which is not where the user was.
      onPress={() => router.navigate("/")}
      style={({ pressed }) => [
        { paddingRight: spacing.md },
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons color={theme.text} name="chevron-back" size={26} />
    </Pressable>
  );
}
