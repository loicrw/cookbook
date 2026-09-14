# How the frontend is put together

Reference for working on the app. For running and writing tests, see
[how-to-test.md](./how-to-test.md).

## Directory structure

Expo Router publishes a page for every file under `app/`, so only real routes
live there. Everything shared sits in `src/` and is imported through the `@/`
alias, for example `@/src/utils/recipes`.

```
app/                          # Routes only (expo-router file-based routing)
├── _layout.tsx               # Root stack + providers
├── +html.tsx                 # The HTML document the web build is served in
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
│   ├── index.ts              # Component exports
│   └── __tests__/            # A test file per component
├── constants/
│   ├── recipeTemplate.ts     # The import format, described for an LLM
│   ├── settings.ts           # The letter sizes on offer
│   └── storage.ts            # Storage key and data schema version
├── context/
│   ├── AppDataContext.tsx    # Owns the stored blob; see the hooks below
│   └── NoticeContext.tsx     # The one dialog used to tell the user something
├── styles/
│   └── common.ts             # Theme tokens and shared styles
├── test-utils/               # Builders, storage seeding, render with providers
├── types/
│   └── app.ts                # App data types
└── utils/
    ├── fileOperations.ts     # File import/export operations
    ├── local_storage.ts      # AsyncStorage operations
    ├── recipes.ts            # Validation and normalisation of recipe data
    └── text.ts               # Wording helpers for counts

__tests__/screens/            # Screen and layout tests, kept out of app/
__mocks__/expo-router.tsx     # Router stand-in, used by every test
scripts/
└── generate-route-types.js   # Regenerates .expo/types/router.d.ts
```

Test files sit beside the code they cover, in `__tests__` folders, except for
the screens: anything under `app/` becomes a published route, so their tests
live in `__tests__/screens/` at the root instead.

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

The first read is asynchronous, and the app writes nothing until it has read.
Screens that render stored data show `LoadingScreen` until then.

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

The template's own worked example is fed back through `parseRecipes` in the
tests, so the format it describes cannot drift from the one the app accepts.

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
