import { supabase } from "../services/supabase.js";

async function uploadImageToSupabase(imageFile) {
  return imageFile
    ? await supabase.storage
        .from("images")
        .upload(imageFile.originalname, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false,
          cacheControl: "no-cache",
        })
    : { error: null, data: null };
}

async function updateImageInSupabase(imagePath, imageFile) {
  const deletedImage = imagePath
    ? await supabase.storage.from("images").remove([imagePath])
    : { error: null, data: null };
  if (deletedImage.error) return deletedImage;

  return imageFile
    ? await supabase.storage
        .from("images")
        .upload(imageFile.originalname, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: false,
          cacheControl: "no-cache",
        })
    : { error: null, data: null };
}

async function deleteImageFromSupabase(imagePath) {
  return imagePath
    ? await supabase.storage.from("images").remove([imagePath])
    : { error: null, data: null };
}

function getImageURL(image_path) {
  return image_path
    ? supabase.storage.from("images").getPublicUrl(image_path)
    : { data: { publicUrl: null }, error: null };
}

export {
  uploadImageToSupabase,
  updateImageInSupabase,
  deleteImageFromSupabase,
  getImageURL,
};
