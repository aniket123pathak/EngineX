// src/controllers/submission.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Submission } from "../models/submission.model.js";
import { Problem } from "../models/problem.model.js";

/**
 * WORKFLOW: SUBMIT CODE
 * 1. Extract problem ID, code, and language from the request.
 * 2. Verify the problem actually exists.
 * 3. Save the submission as PENDING.
 * 4. [TODO] Push to Message Queue (RabbitMQ/Redis).
 * 5. Return the submission ID to the frontend so it can start polling for updates.
 */
export const submitCode = asyncHandler(async (req, res) => {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
        throw new ApiError(400, "Problem ID, code, and language are required");
    }

    // Ensure the problem exists before accepting code for it
    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }

    // Create the pending submission
    const submission = await Submission.create({
        user: req.user._id, // verifyJWT guarantees this exists
        problem: problemId,
        code,
        language
    });

    if (!submission) {
        throw new ApiError(500, "Failed to record submission");
    }

    // TODO: In the next step, we will add the code here to push `submission._id` to a Redis Queue

    // We only return the basic info. The frontend will use the `_id` to poll for the final verdict.
    return res.status(201).json(
        new ApiResponse(201, {
            submissionId: submission._id,
            status: submission.status
        }, "Submission received and queued for processing")
    );
});