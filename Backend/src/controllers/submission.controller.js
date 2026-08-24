import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Submission } from "../models/submission.model.js";
import { Problem } from "../models/problem.model.js";
import { evaluateSubmission } from "../utils/codeRunner.js";
import { addJobToQueue } from "../queue/localQueue.js";
import { runCodeSnippet } from "../utils/codeRunner.js";
import { Contest } from "../models/contest.model.js";
import { ContestRegistration } from "../models/contestRegistration.model.js";

export const submitCode = asyncHandler(async (req, res) => {
  const { problemId, code, language } = req.body;
  if (!problemId || !code || !language) {
    throw new ApiError(400, "Problem ID, code, and language are required");
  }
  const problem = await Problem.findById(problemId);
  if (!problem) {
    throw new ApiError(404, "Problem not found");
  }

  if (problem.author.toString() !== req.user._id.toString()) {
    if (problem.isPrivate || problem.publicAfter > new Date()) {
      const contest = await Contest.findOne({ problems: problemId });

      if (contest) {
        const currentTime = new Date();
        if (currentTime < contest.startTime) {
          throw new ApiError(
            403,
            "You cannot submit code before the contest starts.",
          );
        }

        if (contest.visibility === "PRIVATE") {
          const isRegistered = await ContestRegistration.findOne({
            user: req.user._id,
            contest: contest._id,
          });
          if (!isRegistered) {
            throw new ApiError(
              403,
              "You are not registered for this private contest.",
            );
          }
        }
      } else {
        throw new ApiError(
          403,
          "This problem is currently not accepting submissions.",
        );
      }
    }
  }

  const submission = await Submission.create({
    user: req.user._id,
    problem: problemId,
    code,
    language,
    status: "PENDING",
  });
  addJobToQueue({
    submissionId: submission._id,
    problemId: problem._id,
    code,
    language,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
  });
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        submissionId: submission._id,
        status: "PENDING",
      },
      "Code submitted to queue successfully",
    ),
  );
});
export const getSubmissionStatus = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId);
  if (!submission) {
    throw new ApiError(404, "Submission not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        submission,
        "Submission status fetched successfully",
      ),
    );
});

export const runCode = asyncHandler(async (req, res) => {
  const { problemId, code, language, customInput } = req.body;

  if (!code || !language) {
    throw new ApiError(400, "Code and language are required");
  }

  let timeLimit = 2000;
  let memoryLimit = 256;

  if (problemId) {
    const problem = await Problem.findById(problemId);
    if (problem) {
      timeLimit = problem.timeLimit;
      memoryLimit = problem.memoryLimit;
    }
  }

  const result = await runCodeSnippet(
    code,
    language,
    customInput || "",
    timeLimit,
    memoryLimit,
  );

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Code executed successfully"));
});
