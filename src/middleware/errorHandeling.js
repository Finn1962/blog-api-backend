function errorHandeling(err, req, res, next) {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An internal server error has occurred.",
  });
}

export { errorHandeling };
