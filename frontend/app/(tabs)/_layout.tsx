import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "@/src/context/AppDataContext";
import { scaleFont, spacing, theme } from "@/src/styles/common";

/**
 * Lifts the bar clear of the bottom edge. The safe-area inset alone leaves the
 * icons sitting in the curve of a rounded screen, where they read as squashed.
 */
const BOTTOM_LIFT = spacing.sm;

/** The bottom bar: recipes list, the basket, the add-recipe flow, and settings. */
export default function TabsLayout() {
  const { fontScale, settings } = useSettings();
  const insets = useSafeAreaInsets();
  const cookbookTitle = settings.authorName
    ? `${settings.authorName}'s Recipes`
    : "Recipes";

  // Icons grow with the letter size, as the labels do.
  const iconSize = (size: number) => scaleFont(size, fontScale);

  return (
    <Tabs
      // Going back leaves the tab that was open before this one, rather than
      // jumping to whichever tab happens to be declared first.
      backBehavior="history"
      screenOptions={{
        headerStyle: { backgroundColor: theme.surface },
        headerTintColor: theme.text,
        headerTitleStyle: { fontSize: scaleFont(17, fontScale) },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: scaleFont(11, fontScale) },
        tabBarStyle: {
          backgroundColor: theme.surface,
          height: scaleFont(54, fontScale) + insets.bottom + BOTTOM_LIFT,
          paddingBottom: insets.bottom + BOTTOM_LIFT,
        },
      }}
    >
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="settings-outline"
              color={color}
              size={iconSize(size)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="basket"
        options={{
          title: "Basket",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="basket-outline"
              color={color}
              size={iconSize(size)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add recipe",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="add-circle-outline"
              color={color}
              size={iconSize(size)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          // The tab keeps the short label; only the header is personalised.
          headerTitle: cookbookTitle,
          title: "Recipes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" color={color} size={iconSize(size)} />
          ),
        }}
      />
      <Tabs.Screen
        name="recipe"
        options={{
          // Reached from a recipe card rather than from the bar, and it brings
          // its own header, so it is hidden here without leaving the tabs.
          headerShown: false,
          href: null,
        }}
      />
    </Tabs>
  );
}
