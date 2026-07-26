
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Submission } from "../models/submission.model.js";
import { Problem } from "../models/problem.model.js";
import { evaluateSubmission } from "../utils/codeRunner.js"; 
import { addJobToQueue } from "../queue/localQueue.js";
export const submitCode = asyncHandler(async (req, res) => {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language) {
        throw new ApiError(400, "Problem ID, code, and language are required");
    }
    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }
    const submission = await Submission.create({
        user: req.user._id, 
        problem: problemId,
        code,
        language,
        status: "PENDING"
    });
    addJobToQueue({
        submissionId: submission._id,
        problemId: problem._id,
        code,
        language,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit
    });
    return res.status(200).json(
        new ApiResponse(200, {
            submissionId: submission._id,
            status: "PENDING"
        }, "Code submitted to queue successfully")
    );
});
export const getSubmissionStatus = asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const submission = await Submission.findById(submissionId);
    if (!submission) {
        throw new ApiError(404, "Submission not found");
    }
    return res.status(200).json(
        new ApiResponse(200, submission, "Submission status fetched successfully")
    );
});