import { Contest } from "../models/contest.model.js";
import { ContestRegistration } from "../models/contestRegistration.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Problem } from "../models/problem.model.js";

export const createContest = asyncHandler(async (req, res) => {
    const { name, description, startTime, endTime, visibility, password } = req.body;

    if (!name || !description || !startTime || !endTime) {
        throw new ApiError(400, "All required fields must be provided");
    }

    if (visibility === "PUBLIC" && req.user.role !== "ADMIN") {
        throw new ApiError(403, "Only admins can create Public contests. You can only create Private contests.");
    }

    if (visibility === "PRIVATE" && !password) {
        throw new ApiError(400, "Private contests require a room password.");
    }

    const contest = await Contest.create({
        name,
        description,
        startTime,
        endTime,
        author: req.user._id,
        visibility: visibility || "PRIVATE",
        password: visibility === "PRIVATE" ? password : null
    });

    const createdContest = contest.toObject();
    delete createdContest.password;

    return res.status(201).json(
        new ApiResponse(201, createdContest, "Contest created successfully")
    );
});

export const getAllContests = asyncHandler(async (req, res) => {
    const contests = await Contest.find()
        .select("-password -problems") 
        .populate("author", "username")
        .sort({ startTime: -1 });

    return res.status(200).json(
        new ApiResponse(200, contests, "Contests fetched successfully")
    );
});

export const registerForContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const { password } = req.body; // Needed if contest is PRIVATE

    const contest = await Contest.findById(contestId);
    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    const existingRegistration = await ContestRegistration.findOne({
        user: req.user._id,
        contest: contestId
    });

    if (existingRegistration) {
        throw new ApiError(400, "You are already registered for this contest");
    }

    if (contest.visibility === "PRIVATE") {
        if (!password) {
            throw new ApiError(400, "This is a private contest. Password is required.");
        }
        
        const isCorrect = await contest.isPasswordCorrect(password);
        if (!isCorrect) {
            throw new ApiError(401, "Incorrect contest password");
        }
    }

    const registration = await ContestRegistration.create({
        user: req.user._id,
        contest: contestId
    });

    return res.status(201).json(
        new ApiResponse(201, registration, "Successfully registered for the contest")
    );
});

export const addProblemToContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const { problemId } = req.body;

    const contest = await Contest.findById(contestId);
    const problem = await Problem.findById(problemId);

    if (!contest || !problem) {
        throw new ApiError(404, "Contest or Problem not found");
    }

    if (contest.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You do not have permission to modify this contest. Only the author can add problems.");
    }

    if (contest.problems.length >= 10) {
        throw new ApiError(400, "A contest can have a maximum of 10 problems.");
    }

    if (contest.problems.some(id => id.toString() === problemId.toString())) {
        throw new ApiError(400, "This problem is already in the contest.");
    }

    // Push the problem and save
    if (contest.visibility === "PUBLIC") {
        problem.isPrivate = false;
        problem.publicAfter = contest.endTime; 
    } else {
        problem.isPrivate = true;
    }
    
    await problem.save(); 

    contest.problems.push(problemId);
    await contest.save();

    return res.status(200).json(
        new ApiResponse(200, contest, "Problem added and lifecycle configured")
    );
});

export const getContest = asyncHandler(async (req, res) => {
    const { contestId } = req.params;
    const userId = req.user._id;

    const contest = await Contest.findById(contestId)
        .populate("author", "username email")
        .populate("problems", "title difficulty isGlobal");

    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    const isAuthor = contest.author._id.toString() === userId.toString();

    if (contest.visibility === "PRIVATE" && !isAuthor) {
        const isRegistered = await ContestRegistration.findOne({
            user: userId,
            contest: contestId
        });

        if (!isRegistered) {
            throw new ApiError(403, "You must register for this private contest first.");
        }
    }

    const currentTime = new Date();
    const contestObject = contest.toObject();

    if (currentTime < contest.startTime && !isAuthor) {
        delete contestObject.problems;
        contestObject.message = "Problems will be revealed when the contest starts.";
    }

    delete contestObject.password;

    return res.status(200).json(
        new ApiResponse(200, contestObject, "Contest details fetched successfully")
    );
});

export const removeProblemFromContest = asyncHandler(async (req, res) => {
    const { contestId, problemId } = req.params;

    const contest = await Contest.findById(contestId);
    
    if (!contest) {
        throw new ApiError(404, "Contest not found");
    }

    if (contest.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Only the author can modify this contest.");
    }

    contest.problems = contest.problems.filter(
        (id) => id.toString() !== problemId.toString()
    );

    await contest.save();

    return res.status(200).json(
        new ApiResponse(200, contest, "Problem removed from contest")
    );
});