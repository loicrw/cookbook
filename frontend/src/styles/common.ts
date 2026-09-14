import { StyleSheet } from "react-native";

export const theme = {
  background: "#f8fafc",
  border: "#e2e8f0",
  danger: "#dc2626",
  muted: "#64748b",
  primary: "#4f46e5",
  primarySoft: "#eef2ff",
  surface: "#ffffff",
  text: "#0f172a",
};

/**
 * Applies the letter-size preference from `useSettings().fontScale` to
 * something that is not text: an icon, or a box sized to match a line of it.
 * Text itself is scaled by the `Text` component, so it needs no help here.
 */
export const scaleFont = (size: number, scale: number) =>
  Math.round(size * scale);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.sm,
  },
  card: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 12,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: theme.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  label: {
    color: theme.muted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderRadius: 8,
    borderWidth: 1,
    color: theme.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  inputMultiline: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: theme.danger,
  },
  errorText: {
    color: theme.danger,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  mutedText: {
    color: theme.muted,
    fontSize: 14,
  },
  button: {
    alignItems: "center",
    backgroundColor: theme.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  buttonSecondary: {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
  },
  buttonDanger: {
    backgroundColor: theme.danger,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonTextSecondary: {
    color: theme.text,
  },
  chip: {
    alignItems: "center",
    backgroundColor: theme.primarySoft,
    borderRadius: 999,
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  chipText: {
    color: theme.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
});
