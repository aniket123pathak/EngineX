// src/models/submission.model.js
import mongoose, { Schema } from "mongoose";

/**
 * MAIN SCHEMA: The Code Submission
 * This tracks the exact state of a user's attempt at solving a problem.
 */
const submissionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, // Optimizes finding "All submissions by User X"
        },
        problem: {
            type: Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
            index: true, // Optimizes finding "All submissions for Problem Y"
        },
        code: {
            type: String,
            required: [true, "Source code is required"],
        },
        language: {
            type: String,
            // Restrict exactly which languages your engine supports
            enum: ["cpp", "java", "python", "javascript", "rust"], 
            required: true,
        },
        status: {
            type: String,
            enum: [
                "PENDING",              // Code received, waiting in queue
                "PROCESSING",           // Worker is currently running it
                "ACCEPTED",             // All test cases passed
                "WRONG_ANSWER",         // Output did not match expected
                "TIME_LIMIT_EXCEEDED",  // Ran too long
                "MEMORY_LIMIT_EXCEEDED",// Used too much RAM
                "RUNTIME_ERROR",        // Crashed during execution (e.g., Division by Zero)
                "COMPILATION_ERROR"     // Syntax error, failed to compile
            ],
            default: "PENDING",
            index: true, // Optimizes querying "Show me all accepted submissions"
        },
        // --- METRICS (Populated by the Rust Worker later) ---
        executionTime: {
            type: Number, // Measured in milliseconds
            default: null,
        },
        memoryUsed: {
            type: Number, // Measured in Megabytes
            default: null,
        },
        errorMessage: {
            type: String, // Stores the stack trace if it crashes
            default: null,
        }
    },
    {
        timestamps: true,
    }
);

export const Submission = mongoose.model("Submission", submissionSchema);