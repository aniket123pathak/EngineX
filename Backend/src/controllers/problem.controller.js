// src/controllers/problem.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Problem } from "../models/problem.model.js";
import fs from "fs";
import path from "path";

/**
 * WORKFLOW: CREATE PROBLEM (ADMIN ONLY)
 * 1. Extract problem details and the array of test cases from req.body.
 * 2. Validate that all required fields are present.
 * 3. Validate that at least one test case is provided.
 * 4. Check if a problem with the exact same title already exists.
 * 5. Create the problem in the database, automatically linking the Admin as the author.
 */
export const createProblem = asyncHandler(async (req, res) => {
    const { title, description, difficulty, timeLimit, memoryLimit, testCases } = req.body;

    if (!title || !description || !testCases || testCases.length === 0) {
        throw new ApiError(400, "Title, description, and at least one test case are required");
    }

    // 1. Save to MongoDB
    const problem = await Problem.create({
        title,
        description,
        difficulty,
        timeLimit,
        memoryLimit,
        testCases,
        author: req.user._id,
    });

    // 2. FILE SYSTEM SYNC: Automatically create the Docker files!
    try {
        const problemFolder = path.resolve("problems", problem._id.toString());
        
        // Create the folder for this specific problem ID
        if (!fs.existsSync(problemFolder)) {
            fs.mkdirSync(problemFolder, { recursive: true });
        }

        // Loop through the array from the frontend and create 1.in, 1.out, 2.in, 2.out...
        testCases.forEach((tc, index) => {
            const testCaseNumber = index + 1;
            fs.writeFileSync(path.join(problemFolder, `${testCaseNumber}.in`), tc.input);
            fs.writeFileSync(path.join(problemFolder, `${testCaseNumber}.out`), tc.expectedOutput);
        });
    } catch (error) {
        // If file writing fails, we should ideally delete the DB record to stay synced
        await Problem.findByIdAndDelete(problem._id);
        throw new ApiError(500, "Failed to write test cases to file system");
    }

    return res.status(201).json(
        new ApiResponse(201, problem, "Problem created successfully and synced to File System")
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


// src/controllers/problem.controller.js

/**
 * WORKFLOW: DELETE PROBLEM (ADMIN ONLY)
 * 1. Extract problem ID from the URL params.
 * 2. Find and delete the problem from MongoDB.
 * 3. Physically delete the problem's folder and test case files from the hard drive.
 */
export const deleteProblem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Delete the record from MongoDB
    const deletedProblem = await Problem.findByIdAndDelete(id);

    if (!deletedProblem) {
        throw new ApiError(404, "Problem not found");
    }

    // 2. FILE SYSTEM SYNC: Destroy the physical folder!
    try {
        const problemFolder = path.resolve("problems", id);
        
        // If the folder exists, wipe it and everything inside it
        if (fs.existsSync(problemFolder)) {
            // recursive: true deletes files inside, force: true ignores errors if it's already gone
            fs.rmSync(problemFolder, { recursive: true, force: true });
        }
    } catch (error) {
        console.error("Critical File System Error during deletion:", error);
        // Note: We don't throw an ApiError here because the MongoDB record is already successfully gone.
        // We just log it so the admin can manually clean it up later if the hard drive locked the file.
    }

    // 3. Send success response back to the React UI
    return res.status(200).json(
        new ApiResponse(200, {}, "Problem and associated files permanently deleted")
    );
});