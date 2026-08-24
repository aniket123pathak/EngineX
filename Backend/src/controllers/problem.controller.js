import { Contest } from "../models/contest.model.js";
import { ContestRegistration } from "../models/contestRegistration.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Problem } from "../models/problem.model.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
export const createProblem = asyncHandler(async (req, res) => {
  const { title, description, difficulty, timeLimit, memoryLimit, testCases } =
    req.body;

  if (!title || !description || !testCases || testCases.length === 0) {
    throw new ApiError(
      400,
      "Title, description, and at least one test case are required",
    );
  }

  const formattedTestCases = testCases.map((tc) => ({
    input: tc.input,
    expectedOutput: tc.expectedOutput,
    isHidden: tc.isHidden === true || tc.hidden === true,
  }));

  const problem = await Problem.create({
    title,
    description,
    difficulty,
    timeLimit,
    memoryLimit,
    testCases: formattedTestCases,
    author: req.user._id,
    isPrivate: false,
    publicAfter: Date.now(),
  });

  try {
    const problemFolder = path.resolve("problems", problem._id.toString());
    if (!fs.existsSync(problemFolder)) {
      fs.mkdirSync(problemFolder, { recursive: true });
    }
    testCases.forEach((tc, index) => {
      const testCaseNumber = index + 1;
      fs.writeFileSync(
        path.join(problemFolder, `${testCaseNumber}.in`),
        tc.input,
      );
      fs.writeFileSync(
        path.join(problemFolder, `${testCaseNumber}.out`),
        tc.expectedOutput,
      );
    });
  } catch (error) {
    await Problem.findByIdAndDelete(problem._id);
    throw new ApiError(500, "Failed to write test cases to file system");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, problem, "Problem created successfully"));
});
export const getAllProblems = asyncHandler(async (req, res) => {
  const currentTime = new Date();
  const problems = await Problem.find({
    isPrivate: false,
    publicAfter: { $lte: currentTime },
  }).select("-testCases");
  return res
    .status(200)
    .json(new ApiResponse(200, problems, "Problem list fetched successfully"));
});
export const getProblemById = asyncHandler(async (req, res) => {
  const problemId = req.params.problemId || req.params.id;

  if (!problemId || problemId === "undefined") {
    throw new ApiError(400, "Invalid Problem ID received.");
  }

  let userId = req.user?._id;
  if (!userId) {
    try {
      const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
      if (token) {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        userId = decodedToken?._id;
      }
    } catch (error) {}
  }

  const problem = await Problem.findById(problemId);

  if (!problem) {
    throw new ApiError(404, "Problem not found in the database.");
  }

  const isAuthor = userId && problem.author.toString() === userId.toString();

  if (problem.isPrivate || problem.publicAfter > new Date()) {
    if (!userId) {
      throw new ApiError(
        401,
        "You must be logged in to view this private contest problem.",
      );
    }

    const contest = await Contest.findOne({ problems: problemId });

    if (contest && !isAuthor) {
      const currentTime = new Date();

      if (currentTime < contest.startTime) {
        throw new ApiError(
          403,
          "This problem is locked until the contest begins.",
        );
      }

      if (contest.visibility === "PRIVATE") {
        const isRegistered = await ContestRegistration.findOne({
          user: userId,
          contest: contest._id,
        });
        if (!isRegistered) {
          throw new ApiError(
            403,
            "You must register for the private contest to view this problem.",
          );
        }
      }
    } else if (!contest && !isAuthor) {
      throw new ApiError(
        403,
        "This problem is currently hidden by the author.",
      );
    }
  }

  let sanitizedProblem = problem.toObject();

  if (!isAuthor && sanitizedProblem.testCases) {
    sanitizedProblem.testCases = sanitizedProblem.testCases.filter(
      (tc) => tc.isHidden !== true && tc.isHidden !== "true",
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, sanitizedProblem, "Problem fetched successfully"),
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
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "Problem and associated files permanently deleted",
      ),
    );
});
