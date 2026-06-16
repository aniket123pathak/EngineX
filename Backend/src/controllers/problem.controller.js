// src/controllers/problem.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Problem } from "../models/problem.model.js";

/**
 * WORKFLOW: CREATE PROBLEM (ADMIN ONLY)
 * 1. Extract problem details and the array of test cases from req.body.
 * 2. Validate that all required fields are present.
 * 3. Validate that at least one test case is provided.
 * 4. Check if a problem with the exact same title already exists.
 * 5. Create the problem in the database, automatically linking the Admin as the author.
 */
export const createProblem = asyncHandler(async (req, res) => {
    const { 
        title, 
        description, 
        difficulty, 
        timeLimit, 
        memoryLimit, 
        testCases 
    } = req.body;

    // 1. Basic Field Validation
    if (!title || !description || !difficulty) {
        throw new ApiError(400, "Title, description, and difficulty are required fields");
    }

    // 2. Test Case Validation
    // A problem is useless without test cases for the engine to run against.
    if (!testCases || !Array.isArray(testCases) || testCases.length === 0) {
        throw new ApiError(400, "You must provide at least one test case");
    }

    // Ensure every test case has an input and an expectedOutput
    const isValidTestCases = testCases.every(tc => tc.input && tc.expectedOutput);
    if (!isValidTestCases) {
        throw new ApiError(400, "Every test case must include both 'input' and 'expectedOutput'");
    }

    // 3. Uniqueness Check
    const existingProblem = await Problem.findOne({ title: title.trim() });
    if (existingProblem) {
        throw new ApiError(409, "A problem with this title already exists. Please choose a unique title.");
    }

    // 4. Create the Problem
    // Notice how we use `req.user._id`. We know this exists securely because 
    // the verifyJWT middleware ensures only logged-in users reach this point.
    const newProblem = await Problem.create({
        title: title.trim(),
        description,
        difficulty,
        timeLimit: timeLimit || 1000,     // Default to 1s if not provided
        memoryLimit: memoryLimit || 256,   // Default to 256MB if not provided
        author: req.user._id,              // The Admin creating it
        testCases
    });

    // 5. Check if creation failed at the DB level
    if (!newProblem) {
        throw new ApiError(500, "An error occurred while saving the problem to the database");
    }

    // 6. Respond Success
    return res.status(201).json(
        new ApiResponse(201, newProblem, "Problem created successfully")
    );
});

// src/controllers/problem.controller.js (Add these to the bottom)

/**
 * WORKFLOW: GET ALL PROBLEMS (For the Dashboard)
 * 1. Fetch all problems from the database.
 * 2. PERFORMANCE OPTIMIZATION: Do not send the description or test cases. 
 * The dashboard only needs the Title and Difficulty to display the list.
 */
export const getAllProblems = asyncHandler(async (req, res) => {
    // .select() tells MongoDB exactly which fields to return.
    // This reduces a 50MB payload down to a few Kilobytes, making your site lightning fast.
    const problems = await Problem.find({}).select("title difficulty timeLimit memoryLimit");

    return res.status(200).json(
        new ApiResponse(200, problems, "Problem list fetched successfully")
    );
});


/**
 * WORKFLOW: GET PROBLEM BY ID (For the actual coding page)
 * 1. Find the problem using the ID in the URL.
 * 2. SECURITY OPTIMIZATION: Filter out any test case where `isHidden: true`.
 * 3. Send the sanitized problem to the frontend.
 */
export const getProblemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const problem = await Problem.findById(id);

    if (!problem) {
        throw new ApiError(404, "Problem not found");
    }

    // Convert the Mongoose Document into a plain JavaScript object so we can modify it
    const problemObj = problem.toObject();

    // Filter out the secret test cases so the frontend never receives them
    problemObj.testCases = problemObj.testCases.filter(
        (testCase) => testCase.isHidden === false
    );

    return res.status(200).json(
        new ApiResponse(200, problemObj, "Problem fetched successfully")
    );
});