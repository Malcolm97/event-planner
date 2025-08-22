import { supabase } from './supabase';

export async function uploadImageToSupabase(file: File, bucketName: string, path: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(path, file);

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Unexpected error during image upload:', error);
    return null;
  }
}
