import { File } from 'expo-file-system';

import { supabase } from './supabase';

// Hermes/React Native exposes `atob` globally (RN >= 0.74) but it is not in the
// default TS lib here — declare it so we can decode picker base64 without a dep.
declare const atob: (data: string) => string;

const BUCKET = 'avatars';
const MATERIALS_BUCKET = 'materials';

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Uploads a profile picture to the private `avatars` bucket under `<userId>/`
 * and returns the stored object path (not a URL). Pass the base64 string from
 * expo-image-picker (`launchImageLibraryAsync({ base64: true })`).
 */
export async function uploadAvatar(
  userId: string,
  base64: string,
  mimeType = 'image/jpeg',
): Promise<string> {
  const ext = (mimeType.split('/')[1] ?? 'jpg').replace('jpeg', 'jpg');
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, base64ToBytes(base64), { contentType: mimeType, upsert: true });
  if (error) throw error;
  return path;
}

/**
 * Returns a short-lived signed URL for a private avatar object path, suitable
 * for an <Image source>. Returns null if no path is stored.
 */
export async function getAvatarSignedUrl(
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Uploads a study-material file (image or PDF) to the private `materials` bucket
 * under `<userId>/` and returns the stored object path. Reads the bytes straight
 * off the local URI from expo-image-picker / expo-document-picker, so it works
 * for both without a base64 round-trip. The filename is randomised so repeated
 * uploads from the same picker session never collide.
 */
export async function uploadMaterialFile(
  userId: string,
  uri: string,
  mimeType = 'application/octet-stream',
): Promise<string> {
  const ext = (mimeType.split('/')[1] ?? 'bin').replace('jpeg', 'jpg');
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = `${userId}/${stamp}.${ext}`;
  const bytes = await new File(uri).bytes();
  const { error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .upload(path, bytes, { contentType: mimeType, upsert: false });
  if (error) throw error;
  return path;
}

/**
 * Returns a short-lived signed URL for a private material object path, suitable
 * for an <Image source> or to open in a viewer. Returns null if no path is stored.
 */
export async function getMaterialFileSignedUrl(
  path: string | null | undefined,
  expiresIn = 3600,
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(MATERIALS_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}
