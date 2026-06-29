import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { recognizePlainText } from '@/lib/ocr';

/** A file the user attached to a new material, before it's uploaded. */
export type MaterialAttachment = {
  uri: string;
  mimeType: string;
  name: string;
};

/** What a pick produced: any text OCR pulled off an image, for the content field. */
type PickResult = { ocrText: string | null };

const EMPTY: PickResult = { ocrText: null };

/**
 * Drives attaching an image (gallery or camera) or a PDF to a new material and,
 * for images, running on-device OCR to pre-fill the content field. The selected
 * file is held locally until the screen uploads it on save (see `uploadMaterialFile`).
 *
 * OCR uses ML Kit, which is native and absent from Expo Go — a failure there is
 * surfaced as `ocrError` rather than thrown, so the image still attaches and the
 * user can type the content by hand.
 */
export function useMaterialAttachment() {
  const [attachment, setAttachment] = useState<MaterialAttachment | null>(null);
  const [busy, setBusy] = useState(false);
  const [ocrError, setOcrError] = useState(false);

  const runOcr = useCallback(async (uri: string): Promise<string | null> => {
    try {
      const text = await recognizePlainText(uri);
      setOcrError(false);
      return text.trim() || null;
    } catch {
      setOcrError(true);
      return null;
    }
  }, []);

  const attachImage = useCallback(
    async (result: ImagePicker.ImagePickerResult): Promise<PickResult> => {
      if (result.canceled) return EMPTY;
      const asset = result.assets[0];
      if (!asset) return EMPTY;
      setBusy(true);
      try {
        setAttachment({
          uri: asset.uri,
          mimeType: asset.mimeType ?? 'image/jpeg',
          name: asset.fileName ?? 'image.jpg',
        });
        return { ocrText: await runOcr(asset.uri) };
      } finally {
        setBusy(false);
      }
    },
    [runOcr],
  );

  const pickImage = useCallback(async (): Promise<PickResult> => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return EMPTY;
    return attachImage(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 }),
    );
  }, [attachImage]);

  const takePhoto = useCallback(async (): Promise<PickResult> => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return EMPTY;
    return attachImage(await ImagePicker.launchCameraAsync({ quality: 0.7 }));
  }, [attachImage]);

  const pickPdf = useCallback(async (): Promise<PickResult> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled) return EMPTY;
    const asset = result.assets[0];
    if (!asset) return EMPTY;
    setOcrError(false);
    setAttachment({
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'application/pdf',
      name: asset.name,
    });
    return EMPTY;
  }, []);

  const clear = useCallback(() => {
    setAttachment(null);
    setOcrError(false);
  }, []);

  return { attachment, busy, ocrError, pickImage, takePhoto, pickPdf, clear };
}
