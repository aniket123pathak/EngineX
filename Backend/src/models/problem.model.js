
import mongoose, { Schema } from "mongoose";
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
    }
});
const problemSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Problem title is required"],
            trim: true,
            unique: true,
            index: true, 
        },
        description: {
            type: String, 
            required: [true, "Problem description is required"],
        },
        difficulty: {
            type: String,
            enum: ["EASY", "MEDIUM", "HARD"],
            required: true,
        },
        timeLimit: {
            type: Number, 
            default: 1000, 
        },
        memoryLimit: {
            type: Number,
            default: 256, 
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User", 
            required: true,
        },
        testCases: [testCaseSchema], 
    },
    {
        timestamps: true,
    }
);
export const Problem = mongoose.model("Problem", problemSchema);