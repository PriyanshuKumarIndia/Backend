import { Router } from "express";
import {
  changeCurrentPassword,
  getCurrentUser,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
); // Testing done

router.route("/login").post(loginUser);

// secured Routes
router.route("/logout").post(verifyJWT, logoutUser); // Testing done

router.route("/refresh-access-token").post(refreshAccessToken); // Testing done

router.route("/change-current-password").post(verifyJWT, changeCurrentPassword); // Testing done

router.route("/current-user").get(verifyJWT, getCurrentUser); // Testing done

router.route("/update-account-details").patch(verifyJWT, updateAccountDetails); // Testing done

router
  .route("/update-user-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar); // Testing done

router
  .route("/update-user-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage); // Testing done

router
  .route("/user-channel-profile/:username")
  .get(verifyJWT, getUserChannelProfile); // Testing done

router.route("/watch-history").get(verifyJWT, getWatchHistory); // Testing done

export default router;
