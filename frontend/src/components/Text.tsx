import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from "react-native";
import { useSettings } from "../context/AppDataContext";

/** React Native's own default, applied when a style asks for no size. */
const BASE_FONT_SIZE = 14;

/**
 * Multiplies whatever size a style asks for by the letter size from Settings.
 *
 * A style without a `fontSize` is scaled from the base size rather than from
 * its parent's, so text nested inside other text should set its own size.
 */
function scaleTextStyle(
  style: StyleProp<TextStyle>,
  scale: number
): TextStyle {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const fontSize =
    typeof flat?.fontSize === "number" ? flat.fontSize : BASE_FONT_SIZE;
  const scaled: TextStyle = { fontSize: Math.round(fontSize * scale) };

  if (typeof flat?.lineHeight === "number") {
    scaled.lineHeight = Math.round(flat.lineHeight * scale);
  }

  return scaled;
}

/**
 * `Text` that follows the letter size preference. Used everywhere in place of
 * React Native's, so that one setting moves every piece of text in the app.
 */
export const Text: React.FC<TextProps> = ({ style, ...rest }) => {
  const { fontScale } = useSettings();
  return <RNText {...rest} style={[style, scaleTextStyle(style, fontScale)]} />;
};

/** `TextInput` that follows the letter size preference, as [[Text]] does. */
export const TextInput: React.FC<TextInputProps> = ({ style, ...rest }) => {
  const { fontScale } = useSettings();
  return (
    <RNTextInput {...rest} style={[style, scaleTextStyle(style, fontScale)]} />
  );
};
