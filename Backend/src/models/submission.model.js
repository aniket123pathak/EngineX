
import mongoose, { Schema } from "mongoose";
const submissionSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true, 
        },
        problem: {
            type: Schema.Types.ObjectId,
            ref: "Problem",
            required: true,
            index: true, 
        },
        code: {
            type: String,
            required: [true, "Source code is required"],
        },
        language: {
            type: String,
            enum: ["cpp", "java", "python", "javascript", "rust"], 
            required: true,
        },
        status: {
            type: String,
            enum: [
                "PENDING",              
                "PROCESSING",           
                "ACCEPTED",             
                "WRONG_ANSWER",         
                "TIME_LIMIT_EXCEEDED",  
                "MEMORY_LIMIT_EXCEEDED",
                "RUNTIME_ERROR",        
                "COMPILATION_ERROR",     
                "SYSTEM_ERROR"
            ],
            default: "PENDING",
            index: true, 
        },
        executionTime: {
            type: Number, 
            default: null,
        },
        memoryUsed: {
            type: Number, 
            default: null,
        },
        errorMessage: {
            type: String, 
            default: null,
        }
    },
    {
        timestamps: true,
    }
);
export const Submission = mongoose.model("Submission", submissionSchema);