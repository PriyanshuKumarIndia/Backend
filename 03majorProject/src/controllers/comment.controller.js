import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const pipelines = [
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    { $sort: { createdAt: -1 } },
  ];

  const commentAggregate = Comment.aggregate(pipelines);
  const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };

  const comments = await Comment.aggregatePaginate(commentAggregate, options);

  res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log("request body: ", req.body);

  const { content } = req.body;

  const userId = req.user._id;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const newComment = await Comment.create({
    content,
    video: new mongoose.Types.ObjectId(videoId),
    owner: new mongoose.Types.ObjectId(userId),
  }).catch((err) => {
    throw new ApiError(500, "Failed to add comment");
  });

  res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "CommentId is not valid");
  }

  const updatedComment = await Comment.findByIdAndUpdate(commentId, {
    content,
  }).catch((err) => {
    throw new ApiError(500, "something went wrong while updating commnet");
  });

  res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "commnet updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId || !isValidObjectId(commentId)) {
    throw new ApiError(400, "CommentId is not valid");
  }

  const deletedComment = await Comment.findByIdAndDelete(commentId).catch(
    (err) => {
      throw new ApiError(500, "something went wrong while deleting comment");
    }
  );

  res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
