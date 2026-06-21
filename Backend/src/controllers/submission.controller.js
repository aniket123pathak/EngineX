// src/controllers/submission.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Submission } from "../models/submission.model.js";
import { Problem } from "../models/problem.model.js";
import { evaluateSubmission } from "../utils/codeRunner.js"; // Import your new engine

/**
 * WORKFLOW: SUBMIT AND EVALUATE CODE (Synchronous V1)
 */
export const submitCode = asyncHandler(async (req, res) => {
    const { problemId, code, language } = req.body;

    if (!problemId || !code || !language) {
        throw new ApiError(400, "Problem ID, code, and language are required");
    }

    // 1. Verify the problem exists
    const problem = await Problem.findById(problemId);
    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }

    // 2. Create the submission record in the database (Mark as PROCESSING)
    const submission = await Submission.create({
        user: req.user._id, 
        problem: problemId,
        code,
        language,
        status: "PROCESSING" // Since we aren't using queues yet, it processes immediately
    });

    try {
        // 3. WAKE UP THE DOCKER ENGINE
        // The folder name on your hard drive must exactly match the problem's MongoDB _id
        const problemFolder = problem._id.toString(); 
        
        // Run the code against the test cases
        const evaluation = await evaluateSubmission(problemFolder, code);

        if (evaluation.verdict === "SYSTEM_ERROR") {
            console.log("HIDDEN ENGINE ERROR:", evaluation.message);
        }

        // 4. Update the database with the final verdict from Docker
        submission.status = evaluation.verdict;
        await submission.save();

        // 5. Return the exact results to the React frontend
        return res.status(200).json(
            new ApiResponse(200, {
                submissionId: submission._id,
                verdict: evaluation.verdict,
                testCasesPassed: evaluation.testCasesChecked,
                details: evaluation.details // Sends back exactly what failed/passed
            }, "Execution completed successfully")
        );

    } catch (error) {
        // Fallback if Docker completely crashes or the hard drive fails
        console.error("CRITICAL ENGINE FAILURE:", error);
        submission.status = "SYSTEM_ERROR";
        await submission.save();
        throw new ApiError(500, "Internal Server Error during code execution");
    }
});