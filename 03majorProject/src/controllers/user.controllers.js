import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

export { registerUser };
