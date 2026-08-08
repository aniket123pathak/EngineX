import mongoose, { Schema } from "mongoose";

const contestRegistrationSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    contest: {
        type: Schema.Types.ObjectId,
        ref: "Contest",
        required: true
    }
}, { timestamps: true });

contestRegistrationSchema.index({ user: 1, contest: 1 }, { unique: true });

export const ContestRegistration = mongoose.model("ContestRegistration", contestRegistrationSchema);