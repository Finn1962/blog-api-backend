import jwt from "jsonwebtoken";

function checkRole(allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(jwt.decode(req.cookies.accessToken).role)) {
      return res.status(403).json({
        error: "No autorisation",
      });
    }
    next();
  };
}

export { checkRole };
