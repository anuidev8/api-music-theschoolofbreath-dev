
const { contactTarget, img, jwtSecret, socketUrl } = require("../configs/vars");
const User = require("../models/user.model");
const Music = require("../models/music.model");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const hashPassword = require("../utils/hasPassword");
const sendEmail = require("../utils/email")
const axios = require("axios");
const { Types } = require("mongoose");

exports.addFavoriteMusic = async (req, res, next) => {
  try {
    const musicId = req.params.music;
    const userId = req.user._id;

    const music = await Music.findById(musicId);

    if (!music) {
      return res.status(400).json({ success: false, info: "Music not found" });
    }

    if (music.favorites.includes(userId)) {
      // El usuario ya ha marcado como favorito, así que lo eliminamos
      await Music.findByIdAndUpdate(musicId, { $pull: { favorites: userId } }, { new: true });
    } else {
      // El usuario no ha marcado como favorito, así que lo agregamos
      await Music.findByIdAndUpdate(musicId, { $push: { favorites: userId } }, { new: true });
    }

    return res.status(200).json({ success: true, music });

  } catch (error) {
    next(error);
  }
};

exports.addFavoriteVideo = async (req, res, next) => {
  try {
    const videoId = req.params.video;
    const userId = req.user._id;

    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(400).json({ success: false, info: "Video not found" });
    }

    if (video.favorites.includes(userId)) {
      // El usuario ya ha marcado como favorito, así que lo eliminamos
      await Video.findByIdAndUpdate(videoId, { $pull: { favorites: userId } }, { new: true });
    } else {
      // El usuario no ha marcado como favorito, así que lo agregamos
      await Video.findByIdAndUpdate(videoId, { $push: { favorites: userId } }, { new: true });
    }

    return res.status(200).json({ success: true, video });

  } catch (error) {
    next(error);
  }
};
exports.getUserByEmail = async (req, res, next) => {
  try {
    const { email } = req.params; // Assuming the email is passed as a route parameter

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Find user by email, excluding sensitive information
    const user = await User.findOne({ email }, { password: 0, __v: 0, role: 0 });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { _id } = req.user;
    if (!_id || !Types.ObjectId.isValid(_id))
      return res
        .status(400)
        .json({ success: false, info: "invalid data structure" });
    const data = await User.findById(_id, { password: 0, _v: 0, role: 0 });
    return res.status(200).json({ success: true, info: "Ok", data: data });
  } catch (error) {
    next(error);
  }
};

// ... [existing imports and code]

exports.updateSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { _id } = req.user;
    const isStartSubscription = req.body.isStartSubscription;

    if (typeof isStartSubscription !== 'boolean') {
      return res.status(400).json({ success: false, info: "Invalid subscription status" });
    }

    const user = await User.findByIdAndUpdate(
      userId, 
      { isStartSubscription: isStartSubscription },
      { new: true, select: '-password -__v -role' } // This projection excludes sensitive data
    );

    if (!user) {
      return res.status(404).json({ success: false, info: "User not found" });
    }
    const data = await User.findById(_id, { password: 0, _v: 0, role: 0 });
    if (!data) {
      return res.status(404).json({ success: false, info: "User not found" });
    }
    return res.status(200).json({ success: true, info: "Subscription status updated",user:data});

  } catch (error) {
    next(error);
  }
};

// Add this to your user controller file

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.user._id; // Get ID from authenticated user
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        info: "User not found"
      });
    }

   

    // Remove user's favorites from Music collection
    await Music.updateMany(
      { favorites: userId },
      { $pull: { favorites: userId } }
    );

    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      info: "User account successfully deleted"
    });

  } catch (error) {
    next(error);
  }
};


