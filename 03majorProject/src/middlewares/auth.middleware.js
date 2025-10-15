import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized access" });
  }

  try {
    const decoded = JsonWebTokenError.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    );
    console.log("authMiddleware.js at line14\ndecoded value: ", decoded);
    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );
    if (!user) {
      return res.status(401).json({ message: "Unauthorized access" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Error occured while verifying user" });
  }
});
