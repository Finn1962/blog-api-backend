import passport from "../utils/passport.js";

//If "optional" is enabled, the JWT token is validated only if it is present
function authUser({ isOptional = false } = {}) {
  return (req, res, next) => {
    if (isOptional && !req.cookies?.accessToken) return next();
    return passport.authenticate("jwt", { session: false })(req, res, next);
  };
}

export { authUser };
