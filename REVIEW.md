# Review Log

## 3. Fix import and export buttons

**File:** `frontend/app/(tabs)/settings.tsx`

**Changes:**
1. Added `flexDirection: "row"` to the `actions` style so the buttons sit side-by-side.
2. Added `flex: 1` via a new `actionButton` style to each button so they stretch equally to fill the available width (matching the behavior of the standalone "Export recipe template" button below).

```diff
  actionButton: {
+   flex: 1,
  },
  actions: {
+   flexDirection: "row",
    gap: spacing.sm,
  },
```

```diff
          <AppButton
            disabled={busy}
            label="Import recipes"
            onPress={handleImport}
+           style={settingsStyles.actionButton}
            variant="secondary"
          />
          <AppButton
            disabled={busy || recipes.length === 0}
            label="Export recipes"
            onPress={handleExport}
+           style={settingsStyles.actionButton}
          />
```

**Verification:** All checks passed (`npm run check` — 425 tests, typecheck, lint, and build).
