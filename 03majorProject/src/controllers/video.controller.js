import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const pipeline = [];
  if (query)
    pipeline.push({ $match: { title: { $regex: query, $options: "i" } } });
  if (userId) {
    pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } });
    pipeline.push({
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
        pipeline: [{ $project: { username: 1, avatar: 1 } }],
      },
    });

    pipeline.push({
      $addFields: { ownerDetails: { $first: "$ownerDetails" } },
    });
  }

  pipeline.push({ $sort: { [sortBy]: sortType === "asc" ? 1 : -1 } });

  const aggregate = Video.aggregate(pipeline);
  const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };

  const result = await Video.aggregatePaginate(aggregate, options);
  res.json(result);
});

const publishAVideo = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "Title and Description are required");
  }

  const { videoFile, thumbnail } = req.files;

  if (
    !videoFile ||
    videoFile.length === 0 ||
    !thumbnail ||
    thumbnail.length === 0
  ) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }

  const videoFilePath = videoFile[0].path;
  const thumbnailPath = thumbnail[0].path;

  if (!videoFilePath || !thumbnailPath) {
    throw new ApiError(400, "Video file is required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoFilePath);
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailPath);

  if (!uploadedVideo || !uploadedThumbnail) {
    throw new ApiError(
      500,
      "Failed to upload video or thumbnail to cloudinary"
    );
  }

  console.log("upload successful");

  const video = await Video.create({
    videoFile: uploadedVideo.secure_url,
    thumbnail: uploadedThumbnail.secure_url,
    title,
    description,
    duration: uploadedVideo.duration,
    owner: userId,
  });

  console.log("video uploaded: ", video);

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId).select("-__v");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;

  const thumbnailFilePath = req.file?.path;
  if (!videoId) {
    if (thumbnailFilePath) fs.unlinkSync(thumbnailFilePath);
    throw new ApiError(400, "Video ID is required");
  }

  if (!isValidObjectId(videoId)) {
    if (thumbnailFilePath) fs.unlinkSync(thumbnailFilePath);
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    if (thumbnailFilePath) fs.unlinkSync(thumbnailFilePath);
    throw new ApiError(404, "Video not found");
  }

  if (title) video.title = title;
  if (description) video.description = description;

  if (thumbnailFilePath) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailFilePath);
    if (!uploadedThumbnail) {
      throw new ApiError(500, "Failed to upload thumbnail to cloudinary");
    }

    video.thumbnail = uploadedThumbnail.secure_url;
  }

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(404, "Video not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
