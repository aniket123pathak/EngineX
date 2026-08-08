import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const contestSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    visibility: {
        type: String,
        enum: ["PUBLIC", "PRIVATE"],
        default: "PRIVATE"
    },
    password: {
        type: String, 
        // Only required if the contest is PRIVATE
        required: function() {
            return this.visibility === "PRIVATE";
        }
    },
    problems: [{
        type: Schema.Types.ObjectId,
        ref: "Problem"
    }]
}, { timestamps: true });

contestSchema.pre("save", async function (next) {
    if (!this.isModified("password") || this.visibility === "PUBLIC") return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

contestSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const Contest = mongoose.model("Contest", contestSchema);