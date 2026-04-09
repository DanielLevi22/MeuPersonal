import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

export interface UploadResult {
  path: string | null;
  publicUrl: string | null;
  error: Error | null;
}

export const SupabaseStorageService = {
  /**
   * Uploads a file from a local URI to Supabase Storage.
   * @param uri Local file URI (file://...)
   * @param bucket Storage bucket name (default: 'assessments')
   * @param path Target path in the bucket
   */
  uploadFile: async (uri: string, bucket: string, path: string): Promise<UploadResult> => {
    try {
      console.log(`Uploading ${uri} to ${bucket}/${path}`);

      // Read file as Base64 first
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // Convert Base64 to ArrayBuffer for Supabase
      const arrayBuffer = decode(base64);

      // determine mime type (basic fallback)
      const isPng = uri.toLowerCase().endsWith('.png');
      const contentType = isPng ? 'image/png' : 'image/jpeg';

      const { error } = await supabase.storage.from(bucket).upload(path, arrayBuffer, {
        contentType: contentType,
        upsert: true,
      });

      if (error) throw error;

      // For private buckets, we don't get a public URL.
      // We return the path so the app can generate signed URLs on demand.
      return {
        path: path,
        publicUrl: null, // Deprecated for private buckets
        error: null,
      };
    } catch (error: unknown) {
      console.error('Supabase Upload Error:', error);
      return {
        path: null,
        publicUrl: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  },

  /**
   * Generates a temporary signed URL for viewing a private file.
   * @param path File path in the bucket
   * @param bucket Bucket name (default: 'assessments')
   * @param expiresIn Seconds until expiration (default: 3600 = 1 hour)
   */
  getSignedUrl: async (
    path: string,
    bucket: string = 'assessments',
    expiresIn: number = 3600
  ): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

      if (error) throw error;

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
  },

  /**
   * Helper to generate a standardized path for assessment photos
   */
  getAssessmentPhotoPath: (
    studentId: string,
    type: 'front' | 'back' | 'side_right' | 'side_left'
  ) => {
    const timestamp = Date.now();
    return `${studentId}/${timestamp}_${type}.jpg`;
  },
};
