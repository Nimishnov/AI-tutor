import { ensureAnonymousUser, supabase } from './supabase';

export const STUDY_IMAGE_BUCKET = 'study-images';
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export async function uploadStudyImage(file: File, materialId: string) {
  if (!supabase) throw new Error('Image attachments need a configured Supabase project. Add the new project URL and publishable key first.');
  if (!IMAGE_TYPES.has(file.type)) throw new Error('Choose a JPG, PNG, WEBP, or GIF image.');
  if (file.size > MAX_IMAGE_SIZE) throw new Error('Choose an image smaller than 10 MB.');
  const user = await ensureAnonymousUser();
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(-80) || 'image';
  const storagePath = `${user.id}/${materialId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from(STUDY_IMAGE_BUCKET).upload(storagePath, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false
  });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
  return { storagePath, mimeType: file.type, fileName: file.name };
}
