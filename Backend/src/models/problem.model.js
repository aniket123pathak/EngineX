// src/models/problem.model.js
import mongoose, { Schema } from "mongoose";

/**
 * SUB-SCHEMA: Test Cases
 * Why a sub-schema? Because a Problem will have multiple test cases.
 * We EMBED these directly inside the Problem document for blazing-fast retrieval.
 */
const testCaseSchema = new Schema({
    input: {
        type: String,
        required: true,
    },
    expectedOutput: {
        type: String,
        required: true,
    },
    isHidden: {
        type: Boolean,
        default: false,
        // If true, the user doesn't see this test case. 
        // It is only used by the Rust engine to evaluate their code.
    }
});

/**
 * MAIN SCHEMA: The Problem
 */
const problemSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Problem title is required"],
            trim: true,
            unique: true,
            index: true, // We want users to be able to search for problems quickly
        },
        description: {
            type: String, // Can store Markdown format (like LeetCode does)
            required: [true, "Problem description is required"],
        },
        difficulty: {
            type: String,
            enum: ["EASY", "MEDIUM", "HARD"],
            required: true,
        },
        // --- THE ENGINE CONSTRAINTS ---
        timeLimit: {
            type: Number, 
            default: 1000, 
            // Measured in milliseconds (e.g., 1000ms = 1 second)
            // The Rust engine will kill the Docker container if it exceeds this.
        },
        memoryLimit: {
            type: Number,
            default: 256, 
            // Measured in Megabytes (MB). 
            // The Rust engine will restrict the Docker container to this RAM.
        },
        // --- RELATIONSHIPS ---
        author: {
            type: Schema.Types.ObjectId,
            ref: "User", // Links to the User who created the problem (Admin)
            required: true,
        },
        testCases: [testCaseSchema], // Array of the embedded test cases we defined above
    },
    {
        timestamps: true,
    }
);

export const Problem = mongoose.model("Problem", problemSchema);