
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Submission } from "../models/submission.model.js";
import { removeAllQueueData } from "bullmq";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); 
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the auth tokens");
    }
};
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if (
        [username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields (username, email, password) are required");
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "A user with this email or username already exists");
    }
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password, 
    });
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user in the database");
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});
export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;
    if (!password || (!username && !email)) {
        throw new ApiError(400, "Username or Email, and Password are required");
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
    };
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken, refreshToken }, 
                "User logged in successfully"
            )
        );
});
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 
            }
        },
        {
            new: true 
        }
    );
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const getUserProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;


        const solvedProblems = await Submission.distinct("problem", {
        user: userId,
        status: "ACCEPTED"
    });
    const totalSolved = solvedProblems.length;

    const recentSubmissions = await Submission.find({ user: userId })
        .populate("problem", "title difficulty")
        .sort({ createdAt: -1 }) 
        .limit(50); 

    return res.status(200).json(
        new ApiResponse(200, {
            user: {
                username: req.user.username,
                email: req.user.email
            },
            stats: {
                totalSolved
            },
            recentSubmissions
        }, "User profile fetched successfully")
    );
});

export const getGlobalLeaderboard = asyncHandler(async (req, res) => {
    const leaderboard = await Submission.aggregate([
        { $match: { status: "ACCEPTED" } },

        { 
            $group: { 
                _id: { user: "$user", problem: "$problem" } 
            } 
        },

        { 
            $group: { 
                _id: "$_id.user", 
                totalSolved: { $sum: 1 } 
            } 
        },

        { $sort: { totalSolved: -1 } },

        { $limit: 100 },

        {
            $lookup: {
                from: "users", 
                localField: "_id",
                foreignField: "_id",
                as: "userInfo"
            }
        },

        { $unwind: "$userInfo" },
        {
            $project: {
                _id: 0,
                userId: "$_id",
                username: "$userInfo.username",
                totalSolved: 1
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, leaderboard, "Leaderboard fetched successfully")
    );
});