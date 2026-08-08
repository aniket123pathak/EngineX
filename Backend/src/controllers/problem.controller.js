import { Contest } from "../models/contest.model.js";
import { ContestRegistration } from "../models/contestRegistration.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Problem } from "../models/problem.model.js";
import fs from "fs";
import path from "path";
export const createProblem = asyncHandler(async (req, res) => {
    const { title, description, difficulty, timeLimit, memoryLimit, testCases, isPrivate } = req.body;
    if (!title || !description || !testCases || testCases.length === 0) {
        throw new ApiError(400, "Title, description, and at least one test case are required");
    }
    const problem = await Problem.create({
        title,
        description,
        difficulty,
        timeLimit,
        memoryLimit,
        testCases,
        author: req.user._id,
        isPrivate: isPrivate === true ? true : false,
    });

    try {
        const problemFolder = path.resolve("problems", problem._id.toString());
        if (!fs.existsSync(problemFolder)) {
            fs.mkdirSync(problemFolder, { recursive: true });
        }
        testCases.forEach((tc, index) => {
            const testCaseNumber = index + 1;
            fs.writeFileSync(path.join(problemFolder, `${testCaseNumber}.in`), tc.input);
            fs.writeFileSync(path.join(problemFolder, `${testCaseNumber}.out`), tc.expectedOutput);
        });
    } catch (error) {
        await Problem.findByIdAndDelete(problem._id);
        throw new ApiError(500, "Failed to write test cases to file system");
    }
    
    return res.status(201).json(
        new ApiResponse(201, problem, "Problem created successfully and synced to File System")
    );
});
export const getAllProblems = asyncHandler(async (req, res) => {
    const currentTime = new Date();
    const problems = await Problem.find({
        isPrivate: false,
        publicAfter: { $lte: currentTime } 
    }).select("-testCases");
    return res.status(200).json(
        new ApiResponse(200, problems, "Problem list fetched successfully")
    );
});
export const getProblemById = asyncHandler(async (req, res) => {
    const { problemId } = req.params;
    const userId = req.user._id;

    const problem = await Problem.findById(problemId).select("-testCases");
    if (!problem) throw new ApiError(404, "Problem not found");

    if (problem.author.toString() === userId.toString()) {
        return res.status(200).json(new ApiResponse(200, problem, "Problem fetched"));
    }

    if (problem.isPrivate || problem.publicAfter > new Date()) {
        const contest = await Contest.findOne({ problems: problemId });

        if (contest) {
            const currentTime = new Date();
            
            if (currentTime < contest.startTime) {
                throw new ApiError(403, "This problem is locked until the contest begins.");
            }

            if (contest.visibility === "PRIVATE") {
                const isRegistered = await ContestRegistration.findOne({
                    user: userId,
                    contest: contest._id
                });
                if (!isRegistered) {
                    throw new ApiError(403, "You must register for the private contest to view this problem.");
                }
            }
        } else {
            throw new ApiError(403, "This problem is currently hidden by the author.");
        }
    }

    return res.status(200).json(
        new ApiResponse(200, problem, "Problem fetched successfully")
    );
});
export const deleteProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deletedProblem = await Problem.findByIdAndDelete(id);
    if (!deletedProblem) {
        throw new ApiError(404, "Problem not found");
    }
    try {
        const problemFolder = path.resolve("problems", id);
        if (fs.existsSync(problemFolder)) {
            fs.rmSync(problemFolder, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("Critical File System Error during deletion:", error);
    }
    return res.status(200).json(
        new ApiResponse(200, {}, "Problem and associated files permanently deleted")
    );
});