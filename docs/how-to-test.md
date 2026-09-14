# How to test the frontend

The frontend has a full unit and component test suite: 425 tests over 29 files,
covering every utility, context, component and screen.

Run it from `frontend/`.

## Running the tests

```bash
npm test                  # the whole suite
npm run test:watch        # re-runs what a change affects
npm run test:coverage     # the whole suite, with a coverage report
```

`npm run check` runs the tests too, alongside the typecheck, the lint and the
web build. That is the command to run before committing.

Narrowing down while working on something:

```bash
npx jest src/utils                       # one folder
npx jest src/utils/__tests__/recipes     # one file, by any part of its path
npx jest -t "scales measured amounts"    # one test, by name
```

A failure prints the file and line, and `--coverage` writes a browsable report
to `frontend/coverage/lcov-report/index.html`.

## What is set up

| File | What it does |
| --- | --- |
| `frontend/jest.config.js` | The `jest-expo` preset, the coverage rules and the thresholds |
| `frontend/jest.setup.tsx` | Runs before every test file: the platform mocks, and clearing storage between tests |
| `frontend/__mocks__/expo-router.tsx` | Stands in for expo-router everywhere |
| `frontend/src/test-utils/` | Builders, storage seeding, and a render that wraps the app's providers |

Only the platform edges are mocked: device storage, the safe area, the app
manifest, the file picker and the router. Everything the app itself owns runs
for real, so a failing test means the app is wrong rather than a mock being out
of date.

## Where tests live

- `frontend/src/**/__tests__/` for utilities, constants, contexts and components.
- `frontend/__tests__/screens/` for the screens and layouts in `app/`.

Screen tests sit outside `app/` on purpose. Expo Router publishes a page for
every file under `app/`, so a test file there would become a route in the built
site. Screens are imported across the boundary instead:

```tsx
import BasketScreen from "@/app/(tabs)/basket";
```

## Writing a test

Everything shared lives in `@/src/test-utils`.

```tsx
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import {
  makeRecipe,
  readStorage,
  renderWithProviders,
  seedStorage,
} from "@/src/test-utils";

it("takes a recipe off the list", async () => {
  await seedStorage({ recipes: [makeRecipe({ id: "bread", title: "Bread" })] });
  renderWithProviders(<BasketScreen />);
  await waitFor(() => expect(screen.queryByTestId("loading-screen")).toBeNull());

  fireEvent.press(screen.getByRole("button", { name: "Remove Bread" }));

  await waitFor(async () =>
    expect((await readStorage())?.basket.entries).toEqual([])
  );
});
```

What the helpers are for:

- `seedStorage(partial)` puts app data in storage before a render, so the
  provider reads it on mount. `readStorage()` reads back what the app wrote,
  which is the real test of whether a change was persisted.
- `renderWithProviders(ui)` wraps the tree in `AppDataProvider` and
  `NoticeProvider`, exactly as `app/_layout.tsx` does. Anything that uses
  `useRecipes`, `useBasket`, `useSettings`, `useNotice` or the app's `Text`
  needs it.
- `makeRecipe`, `makeIngredient`, `makeStep`, `makeManualItem`, `makeAppData`
  build valid data with sensible defaults, so a test only states the field it
  is actually about.
- `flushHydration()` lets the first read of storage land on a screen that does
  not gate on `loading`.

For the router, import from `@/src/test-utils/router` rather than from
`expo-router`. It is the same module Jest substitutes, but typed as the mock, so
no test has to cast:

```tsx
import { mockRouter, resetRouterMock, setSearchParams } from "@/src/test-utils/router";

beforeEach(() => resetRouterMock());

it("opens the recipe", () => {
  setSearchParams({ id: "bread" });
  // ...
  expect(mockRouter.navigate).toHaveBeenCalledWith("/");
});
```

`registeredScreens` and `navigatorProps` record what a layout declared, which is
how the layouts under `app/` are tested without a real navigation tree.

### Conventions

- Find things the way a user would: `getByRole("button", { name })`,
  `getByLabelText`, `getByText`. Reach for `testID` only where there is nothing
  else, as on the loading screen.
- Assert on behaviour, not on the shape of the tree. Counting child nodes breaks
  on a refactor that changed nothing a user can see.
- Name the test after the behaviour, not the function: "drops a tick when the
  line it belongs to leaves the list" says what broke when it fails.
- Cover the awkward input as well as the ordinary one. Most of the suite's value
  is in `src/utils/recipes.ts`, which reads files and storage written by
  anything at all.

## Things that catch people out

- **`jest.spyOn` on something that is already a mock** returns that same mock
  rather than wrapping it, so `mockRestore()` wipes its implementation for the
  rest of the file. AsyncStorage is already a mock: use
  `mockRejectedValueOnce`, never `mockImplementation` plus `mockRestore`.
- **Hydration is asynchronous.** The app reads storage on mount and only writes
  once it has read. A screen acted on before that read lands loses the change.
  Wait for the loading screen to go, or call `flushHydration()`.
- **Icons are text.** `@expo/vector-icons` renders its glyph as a `Text` node
  once the font has loaded, so `getAllByText(/./)` counts icons too. Match the
  string you mean.
- **A hidden `Modal` renders nothing**, so `queryByText` returns null for a
  closed dialog. That is what the "shows nothing while it is closed" tests rely
  on.

## Coverage

`npm run test:coverage` enforces a floor of 90% of lines and statements and 85%
of branches and functions, across `app/` and `src/`. The suite currently sits
near 99% of lines.

The floor is deliberately below where the suite sits, so an ordinary change does
not fail the build over a percentage point. Dropping through it means a whole
path went untested, which is worth stopping for.

Excluded from the count: `src/types/`, which is type-only and executes nothing,
and `src/components/index.ts`, a re-export barrel covered through the modules it
points at.
