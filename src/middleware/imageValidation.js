function validateImage(req, res, next) {
  const image = req.files.find((file) => file.fieldname === "image");

  if (image) {
    image.originalname = `${crypto.randomUUID()}.${image.originalname.split(".")[1]}`;
    if (!image.mimetype.startsWith("image/")) {
      return next(new Error("Only image files are allowed"));
    }
    if (image.size > 2 * 1024 * 1024) {
      return next(new Error("Image is too large"));
    }
  }

  req.image = image;
  next();
}

export { validateImage };
