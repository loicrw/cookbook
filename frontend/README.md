# Welcome to the Cookbook Expo App 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Useful commands
1. Start the app

   ```bash
   npx expo start
   ```

1. Check a change before committing it

   ```bash
   npm run check
   ```

   Regenerates the typed-route declarations, then typechecks, lints and builds
   the web bundle. Expo only regenerates `.expo/types/router.d.ts` from the
   Metro dev server, so `tsc` on its own can fail against a stale route list.
   `npm run routes` does that step alone.

1. Publish the app to github pages

   ```bash
   npm run deploy
   ``` 

1. Install dependencies

   ```bash
   npm install
   ```

## Directory Structure

Expo Router publishes a page for every file under `app/`, so only real routes
live there. Everything shared sits in `src/` and is imported through the `@/`
alias, for example `@/src/utils/recipes`.

```
app/                          # Routes only (expo-router file-based routing)
├── _layout.tsx               # Root stack + providers
└── (tabs)/                   # The bottom bar
    ├── _layout.tsx           # Tab definitions
    ├── index.tsx             # Recipes overview (initial route)
    ├── basket.tsx            # Shopping list, from recipes and added by hand
    ├── add.tsx               # Add a recipe
    ├── settings.tsx          # Letter size, name, and the Data section
    └── recipe/               # Hidden from the bar, so the bar stays visible
        ├── _layout.tsx       # Stack nested inside the tabs
        └── [id]/
            ├── index.tsx     # Read one recipe, tick it off, log a cook
            └── edit.tsx      # Edit or delete one recipe

src/
├── components/               # Reusable UI components
│   ├── AppButton.tsx
│   ├── ChecklistItem.tsx     # Tickable line, used by the recipe and basket
│   ├── ConfirmDialog.tsx     # Modal confirm (Alert.alert is a no-op on web)
│   ├── FloatingButton.tsx    # Round icon button over the content
│   ├── FontSizeSlider.tsx    # One stop per letter size, drawn as a ruler
│   ├── LoadingScreen.tsx     # Shown until storage has been read
│   ├── ManualItemInput.tsx   # Puts one line on the basket by hand
│   ├── RecipeCard.tsx
│   ├── RecipeForm.tsx        # Shared by the add and edit screens
│   ├── Stepper.tsx           # A number with a minus and a plus
│   ├── SuggestInput.tsx      # Text field with autocomplete
│   ├── TagInput.tsx
│   ├── Text.tsx              # Text and TextInput that follow the letter size
│   └── index.ts              # Component exports
├── constants/
│   ├── recipeTemplate.ts     # The import format, described for an LLM
│   ├── settings.ts           # The letter sizes on offer
│   └── storage.ts            # Storage key and data schema version
├── context/
│   ├── AppDataContext.tsx    # Owns the stored blob; see the hooks below
│   └── NoticeContext.tsx     # The one dialog used to tell the user something
├── styles/
│   └── common.ts             # Theme tokens and shared styles
├── types/
│   └── app.ts                # App data types
└── utils/
    ├── fileOperations.ts     # File import/export operations
    ├── local_storage.ts      # AsyncStorage operations
    ├── recipes.ts            # Validation and normalisation of recipe data
    └── text.ts               # Wording helpers for counts

scripts/
└── generate-route-types.js   # Regenerates .expo/types/router.d.ts
```

## App data

Recipes, the basket and the settings are one blob in AsyncStorage, so
`AppDataProvider` owns all of it. Screens read what they need through the
narrower hooks rather than the whole payload:

- `useRecipes()`: the cookbook and its mutations, including `markCooked`
- `useBasket()`: the shopping list, with amounts scaled and merged, plus the
  ticks, which are stored so a reload mid-shop keeps them
- `useSettings()`: the author name and the `fontScale` to apply to text

The basket holds one entry per recipe with the servings to shop for, and never
holds their ingredients: those are derived from the cookbook on every render, so
editing a recipe updates the list with it. Lines added by hand belong to no
recipe, so those are stored, in `manualItems`.

A tick is stored as a key rather than a position, so the two kinds of line are
told apart by which key they use: `ingredientKey` for a line from a recipe,
`manualItemKey` for one added by hand. `basketKeys` is the set of both, and
`prunedBasket` uses it to drop the ticks of lines a change has taken off the
list. Anything that changes the basket goes through it.

Anything read back from storage passes through `normalizeAppData`, which fills in
fields older builds never wrote, migrates the basket from the shape that had no
servings, moves a letter size stored before v5 onto the stop that matches it, and
drops entries whose recipe is gone.

## Importing and exporting

Settings > Data covers all three file operations, in `src/utils/fileOperations.ts`:

- **Export recipes** writes the cookbook as JSON, stamped with `DATA_VERSION`.
- **Import recipes** reads a file back. `parseRecipes` accepts a full export
  payload or a bare array of recipes and normalises every one of them, so a
  hand-written or generated file does not have to be exact.
- **Export recipe template** writes `RECIPE_TEMPLATE` from
  `src/constants/recipeTemplate.ts`: the import format described field by field,
  with a filled-in example, for handing to an LLM asked to write a cookbook file.
  It is built from `DATA_VERSION` so the version it quotes cannot drift. Keep it
  in step with `normalizeRecipe`, which is what actually reads an import.

## Text and the letter size

The letter size in Settings applies to everything, so use `Text` and `TextInput`
from `@/src/components` rather than React Native's. They multiply whatever
`fontSize` and `lineHeight` a style asks for by the current scale. For anything
that is not text but has to match it, such as an icon, use `scaleFont` with
`useSettings().fontScale`.

The sizes on offer are `FONT_SIZE_LEVELS` in `src/constants/settings.ts`, with
the default in the middle so the slider reads smallest to largest around it.
Adding or reordering a stop needs a bump of `DATA_VERSION` and a step in
`migrateFontSizeLevel`, otherwise a stored level points at the wrong size.

## Getting started

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

Screens live in the **app** directory, which uses
[file-based routing](https://docs.expo.dev/router/introduction). Components and
logic live in **src**.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
