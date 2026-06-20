import TextRecognition, {
  TextRecognitionScript,
  type TextRecognitionResult,
} from '@react-native-ml-kit/text-recognition';

/**
 * On-device OCR (Google ML Kit, free, works offline).
 *
 * NOTE: the underlying native module is NOT available in Expo Go — it only runs
 * in a development build or a production/EAS build (see eas.json / README). In
 * Expo Go the call throws a linking error.
 *
 * Pass a local file URI from expo-camera / expo-image-picker (e.g. the captured
 * photo's `uri`).
 */
export async function recognizeText(
  imageUri: string,
  script: TextRecognitionScript = TextRecognitionScript.LATIN,
): Promise<TextRecognitionResult> {
  return TextRecognition.recognize(imageUri, script);
}

/** Convenience: just the flattened recognized text. */
export async function recognizePlainText(imageUri: string): Promise<string> {
  const result = await recognizeText(imageUri);
  return result.text;
}

export { TextRecognitionScript };
export type { TextRecognitionResult };
