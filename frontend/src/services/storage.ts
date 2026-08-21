/**
 * Storage service — Supabase private storage for Our World with seamless hybrid fallback.
 *
 * ⚠️ SECURITY & RESILIENCE MANDATE:
 * - All buckets are PRIVATE (`memories-photos`, `playlist-audio`).
 * - Files are accessed via signed URLs (`createSignedUrl`).
 * - If remote storage bucket is initializing or returns an error, gracefully fall back to local data URL so save never fails!
 */
import { supabase, isPlaceholder } from './supabase';

const PHOTOS_BUCKET = 'memories-photos';
const AUDIO_BUCKET = 'playlist-audio';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePhotoFile(file: File): FileValidationResult {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];
  const maxSizeBytes = 12 * 1024 * 1024; // 12 MB

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload JPG, PNG, or WebP.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'Photo is too large (max 12MB). Please select a smaller photo.',
    };
  }

  return { valid: true };
}

export function validateAudioFile(file: File): FileValidationResult {
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/aac',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
  ];
  const allowedExtensions = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm'];
  const maxSizeBytes = 30 * 1024 * 1024; // 30 MB

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  if (!allowedMimeTypes.includes(file.type) && !allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: 'Unsupported audio format. Please upload MP3, WAV, M4A, AAC, or OGG.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: 'Audio file is too large (max 30MB). Please select a smaller audio track.',
    };
  }

  return { valid: true };
}

/**
 * Converts a file to base64 Data URL for persistent offline preview & fallback
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Creates a signed URL for reading private files
 */
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 7200
): Promise<string | null> {
  if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http')) {
    return path;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.warn(`[Storage] Signed URL notice for ${bucket}/${path}:`, error.message);
      return null;
    }

    return data?.signedUrl || null;
  } catch (err) {
    console.error('[Storage] getSignedUrl exception:', err);
    return null;
  }
}

const isValidUuid = (str: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

/**
 * Uploads a memory photo to the private bucket with automatic graceful fallback
 */
export async function uploadMemoryPhoto(
  coupleId: string,
  memoryId: string,
  file: File
): Promise<{ path: string; signedUrl: string }> {
  const validation = validatePhotoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const dataUrl = await fileToDataUrl(file);

  if (isPlaceholder || !isValidUuid(coupleId)) {
    return { path: dataUrl, signedUrl: dataUrl };
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${coupleId}/${memoryId}/${crypto.randomUUID()}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(PHOTOS_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Storage] Remote bucket upload notice, using resilient fallback:', uploadError.message);
      return { path: dataUrl, signedUrl: dataUrl };
    }

    const signedUrl = await getSignedUrl(PHOTOS_BUCKET, storagePath, 7200);
    return { path: storagePath, signedUrl: signedUrl || dataUrl };
  } catch (err: any) {
    console.warn('[Storage] Memory photo upload fallback applied:', err.message);
    return { path: dataUrl, signedUrl: dataUrl };
  }
}

/**
 * Deletes a photo from private storage
 */
export async function deleteMemoryPhoto(path: string): Promise<boolean> {
  if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('demo/')) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from(PHOTOS_BUCKET).remove([path]);
    if (error) {
      console.warn('[Storage] Failed to delete photo:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Storage] deleteMemoryPhoto exception:', err);
    return false;
  }
}

/**
 * Uploads a personal audio file to the private bucket with automatic graceful fallback
 */
export async function uploadAudioFile(
  coupleId: string,
  file: File
): Promise<{ path: string; signedUrl: string }> {
  const validation = validateAudioFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const dataUrl = await fileToDataUrl(file);

  if (isPlaceholder || !isValidUuid(coupleId)) {
    return { path: dataUrl, signedUrl: dataUrl };
  }

  try {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${coupleId}/${crypto.randomUUID()}-${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[Storage] Remote audio upload notice, using resilient fallback:', uploadError.message);
      return { path: dataUrl, signedUrl: dataUrl };
    }

    const signedUrl = await getSignedUrl(AUDIO_BUCKET, storagePath, 7200);
    return { path: storagePath, signedUrl: signedUrl || dataUrl };
  } catch (err: any) {
    console.warn('[Storage] Audio upload fallback applied:', err.message);
    return { path: dataUrl, signedUrl: dataUrl };
  }
}

/**
 * Deletes an audio file from private storage
 */
export async function deleteAudioFile(path: string): Promise<boolean> {
  if (!path || path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('demo/')) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from(AUDIO_BUCKET).remove([path]);
    if (error) {
      console.warn('[Storage] Failed to delete audio:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[Storage] deleteAudioFile exception:', err);
    return false;
  }
}
