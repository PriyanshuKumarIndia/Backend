import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid User Id");
  }

  const subscribedChannels = Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(channelId) },
    },
  ]).catch((err) => {
    throw new ApiError(500, "Error fetching subscribers");
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribers fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
