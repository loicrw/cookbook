import React from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { spacing, styles, theme } from "../styles/common";
import { Text } from "./Text";

export type ConfirmAction = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
};

interface ConfirmDialogProps {
  actions: ConfirmAction[];
  onDismiss: () => void;
  title: string;
  visible: boolean;
  /** Extra controls, shown between the message and the actions. */
  children?: React.ReactNode;
  message?: string;
}

/**
 * The app's own dialog, used for everything that would otherwise be an
 * `Alert.alert`: that does nothing on react-native-web, cannot offer three
 * choices, and looks nothing like the rest of the app on any platform.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  actions,
  onDismiss,
  title,
  visible,
  children,
  message,
}) => (
  <Modal
    animationType="fade"
    onRequestClose={onDismiss}
    transparent
    visible={visible}
  >
    <Pressable style={dialogStyles.backdrop} onPress={onDismiss}>
      {/* Swallows taps inside the card so they do not dismiss the dialog. */}
      <Pressable style={dialogStyles.card} onPress={() => {}}>
        <Text style={dialogStyles.title}>{title}</Text>
        {!!message && <Text style={dialogStyles.message}>{message}</Text>}

        {!!children && <View style={dialogStyles.body}>{children}</View>}

        <View style={dialogStyles.actions}>
          {actions.map((action) => (
            <Pressable
              accessibilityRole="button"
              key={action.label}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.button,
                action.variant === "secondary" && styles.buttonSecondary,
                action.variant === "danger" && styles.buttonDanger,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  action.variant === "secondary" && styles.buttonTextSecondary,
                ]}
              >
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);

const dialogStyles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: 14,
    gap: spacing.sm,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
  },
  title: {
    color: theme.text,
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    color: theme.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  body: {
    alignItems: "center",
    marginTop: spacing.sm,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
