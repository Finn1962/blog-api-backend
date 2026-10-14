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

async function updateImageFromSupabase(imageFile) {
  return imageFile
    ? await supabase.storage
        .from("images")
        .update(imageFile.originalname, imageFile.buffer, {
          contentType: imageFile.mimetype,
          upsert: true,
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

export {
  uploadImageToSupabase,
  updateImageFromSupabase,
  deleteImageFromSupabase,
};
