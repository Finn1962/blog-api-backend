import path from "path";

function validateImage(req, res, next) {
  const image = req.files.find((file) => file.fieldname === "image");

  if (image) {
    if (!image.mimetype.startsWith("image/")) {
      return next(new Error("Only image files are allowed"));
    }
    if (image.size > 2 * 1024 * 1024) {
      return next(new Error("Image is too large"));
    }

    const extension = path.extname(image.originalname);
    image.originalname = `${crypto.randomUUID()}${extension}`;
  }

  req.image = image;
  next();
}

export { validateImage };
