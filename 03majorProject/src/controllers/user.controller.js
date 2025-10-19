import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Failed to generate tokens");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  console.log("userColtroller.js at line 8", req.body);
  const { email, fullName, username, password } = req.body;

  if (
    [email, fullName, username, password].some(
      (field) => !field || field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existingUser = await User.findOne({
    $or: [
      { email: email.toLowerCase().trim() },
      { username: username.toLowerCase().trim() },
    ],
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }

  const avatarlocalPath = req.files?.avatar?.[0]?.path;
  const coverImagelocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarlocalPath) throw new ApiError(400, "Avatar is required");

  const avatar = await uploadOnCloudinary(avatarlocalPath);
  let coverImage = null;
  if (coverImagelocalPath) {
    coverImage = await uploadOnCloudinary(coverImagelocalPath);
  }

  if (!avatar) throw new ApiError(500, "Failed to upload avatar");

  const user = await User.create({
    email,
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase().trim(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  console.log("userController.js at line 56\ncreatedUser: ", createdUser);

  if (!createdUser) throw new ApiError(500, "Failed to create user");

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  console.log("userController.js at line 78\n", req.body);
  const { email = null, username = null, password = null } = req.body;

  if (!email && !username) {
    throw new ApiError(400, "email or username is required");
  }

  if (!password || password.trim() === "") {
    throw new ApiError(400, "password is required");
  }

  let user = await User.findOne({
    $or: [
      { email: email?.toLowerCase().trim() },
      { username: username?.toLowerCase().trim() },
    ],
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user);

  user = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(200, { user, accessToken }, "User logged in successfully")
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const loggedOutUser = await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        refreshToken: 1, // to null the refreshToken
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, loggedOutUser, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const receivedRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!receivedRefreshToken) {
    throw new ApiError(401, "Unauthorized not refresh token found");
  }

  try {
    const decodedValue = jwt.verify(
      receivedRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedValue._id);

    if (!user || user?.refreshToken !== receivedRefreshToken)
      throw new ApiError(401, "Unauthorized, user not found");

    const options = {
      httpOnly: true,
      secure: true,
    };

    const accessToken = user.generateAccessToken();

    user.accessToken = accessToken;
    await user.save({ validateBeforeSave: false });
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken },
          "Access token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isOldPasswordValid = await user.comparePassword(oldPassword);

  if (!isOldPasswordValid) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: true });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "fields are required to update");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar || !avatar.url) {
    throw new ApiError(500, "Failed to upload avatar");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover file is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage || !coverImage.url) {
    throw new ApiError(500, "Failed to upload coverImage");
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username || username.trim() === "") {
    throw new ApiError(400, "Username is required");
  }

  // const user = await User.findOne({ username: username.trim().toLowerCase() }).select("-password -refreshToken")

  const channel = await User.aggregate([
    {
      $match: { username: username.trim().toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedChannels",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: "$subscribers" },
        subscribedChannelsCount: { $size: "$subscribedChannels" },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedChannelsCount: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel || channel.length === 0) {
    throw new ApiError(404, "Channel not found");
  }

  console.log("userController\nChannel: ", channel);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "Channel profile fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);

  const user = await User.aggregate([
    {
      $match: { _id: userId },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: { $first: "$owner" },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
