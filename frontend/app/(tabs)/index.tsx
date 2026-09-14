import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LoadingScreen, RecipeCard, Text } from "@/src/components";
import { useRecipes } from "@/src/context/AppDataContext";
import { spacing, styles, theme } from "@/src/styles/common";

/** Home screen: an overview card per recipe, newest first. */
export default function RecipesScreen() {
  const { loading, recipes } = useRecipes();
  const router = useRouter();

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={[
          listStyles.content,
          recipes.length === 0 && listStyles.emptyContent,
        ]}
        data={recipes}
        keyExtractor={(recipe) => recipe.id}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <RecipeCard
            onPress={() =>
              // Navigate rather than push: the recipe screen lives in a stack
              // that stays mounted, and one copy of it is enough.
              router.navigate({
                pathname: "/recipe/[id]",
                params: { id: item.id },
              })
            }
            recipe={item}
          />
        )}
      />
    </View>
  );
}

function EmptyState() {
  return (
    <View style={listStyles.empty}>
      <Ionicons name="restaurant-outline" size={48} color={theme.muted} />
      <Text style={listStyles.emptyTitle}>No recipes yet</Text>
      <Text style={[styles.mutedText, listStyles.emptyBody]}>
        Tap &quot;Add recipe&quot; in the bottom bar to write your first one, or
        import an existing cookbook from Settings.
      </Text>
    </View>
  );
}

const listStyles = StyleSheet.create({
  content: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  emptyContent: {
    flexGrow: 1,
  },
  empty: {
    alignItems: "center",
    flex: 1,
    gap: spacing.sm,
    justifyContent: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyBody: {
    textAlign: "center",
  },
});
