import { supabase } from "../services/supabase.js";
import prisma from "../db/prisma.js";

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

async function updateImageInSupabase(imageFile, postId) {
  const post = await prisma.Post.findUnique({
    where: { id: postId },
  });

  const deletedImage = post.image_path
    ? await supabase.storage.from("images").remove([post.image_path])
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

async function deleteImageFromSupabase(postId) {
  const post = await prisma.Post.findUnique({
    where: { id: postId },
  });

  return post.image_path
    ? await supabase.storage.from("images").remove([post.image_path])
    : { error: null, data: null };
}

function getImageURL(post) {
  if (post.image_path) {
    const { data } = supabase.storage
      .from("images")
      .getPublicUrl(post.image_path);
    post.image_url = data.publicUrl;
  }
}

export {
  uploadImageToSupabase,
  updateImageInSupabase,
  deleteImageFromSupabase,
  getImageURL,
};
