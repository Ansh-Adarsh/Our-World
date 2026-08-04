/**
 * Storage service — Supabase private storage.
 * Phase 1: scaffold only. Actual photo upload in Phase 2.
 *
 * ⚠️ All buckets should be PRIVATE.
 * ⚠️ Access via signed URLs, never public bucket URLs.
 */
import { supabase } from './supabase';

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

// Phase 2 will add: uploadMemoryPhoto, deletePhoto, listPhotos
