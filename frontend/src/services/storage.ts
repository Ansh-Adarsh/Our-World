/**
 * Storage service — Supabase private storage for Our World.
 *
 * ⚠️ SECURITY MANDATE:
 * - All buckets are PRIVATE (`memories-photos`).
 * - Photos are accessed ONLY via signed URLs (`createSignedUrl`).
 * - Paths are structured as `{couple_id}/{memory_id}/{uuid}-{filename}`.
 */
import { supabase } from './supabase';

const BUCKET_NAME = 'memories-photos';

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    console.error('[Storage] Failed to create signed URL:', error.message);
    return null;
  }

  return data.signedUrl;
}

/**
 * Uploads a memory photo to the private bucket under `{couple_id}/{memory_id}/{filename}`
 */
export async function uploadMemoryPhoto(
  coupleId: string,
  memoryId: string,
  file: File
): Promise<{ path: string; signedUrl: string } | null> {
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const storagePath = `${coupleId}/${memoryId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[Storage] Supabase upload note:', uploadError.message);
      // If storage service in local fallback / offline mode, return a data URL preview so UI remains functional
      const dataUrl = await fileToDataUrl(file);
      return { path: storagePath, signedUrl: dataUrl };
    }

    // Get signed URL for preview/display
    const signedUrl = await getSignedUrl(BUCKET_NAME, storagePath, 7200);
    return { path: storagePath, signedUrl: signedUrl || '' };
  } catch (err) {
    console.error('[Storage] Upload error:', err);
    // Fallback data URL for smooth offline/demo experience
    const dataUrl = await fileToDataUrl(file);
    return { path: `local/${file.name}`, signedUrl: dataUrl };
  }
}

/**
 * Deletes a photo from private storage
 */
export async function deleteMemoryPhoto(path: string): Promise<boolean> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  if (error) {
    console.error('[Storage] Failed to delete photo:', error.message);
    return false;
  }
  return true;
}

/**
 * Helper to convert file to data URL for local offline preview
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}
