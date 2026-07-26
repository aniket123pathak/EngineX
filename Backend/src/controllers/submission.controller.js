import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Submission } from "../models/submission.model.js";
import { Problem } from "../models/problem.model.js";
import { evaluateSubmission } from "../utils/codeRunner.js"; 
import { addJobToQueue } from "../queue/localQueue.js";
import { runCodeSnippet } from "../utils/codeRunner.js"; 

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

export const runCode = asyncHandler(async (req, res) => {
    const { problemId, code, language, customInput } = req.body;

    if (!code || !language) {
        throw new ApiError(400, "Code and language are required");
    }

    let timeLimit = 2000;
    let memoryLimit = 256;

    // If they provided a problemId, grab the strict limits for that problem
    if (problemId) {
        const problem = await Problem.findById(problemId);
        if (problem) {
            timeLimit = problem.timeLimit;
            memoryLimit = problem.memoryLimit;
        }
    }

    // Execute the code instantly (No Queue, No DB saves!)
    const result = await runCodeSnippet(code, language, customInput || "", timeLimit, memoryLimit);

    return res.status(200).json(
        new ApiResponse(200, result, "Code executed successfully")
    );
});