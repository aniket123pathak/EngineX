// src/models/user.model.js
import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true, // Optimized for fast searching (Critical for Leaderboards)
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        role: {
            type: String,
            enum: ["USER", "ADMIN"], // Admins can create contests, Users can only solve
            default: "USER",
        },
        rating: {
            type: Number,
            default: 1000, // Starting Elo rating for the contest platform
        },
        refreshToken: {
            type: String,
        }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt
    }
);

// --- 🔒 SECURITY HOOK: Hash password before saving ---
userSchema.pre("save", async function (next) {
    // Only hash the password if it was actually modified (or is new)
    if (!this.isModified("password")) return next();

    // 10 is the number of 'salt rounds' (standard security level)
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// --- 🛠️ CUSTOM METHODS ---

// 1. Verify Password Method
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

// 2. Generate Short-Lived Access Token (For API calls)
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            role: this.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

// 3. Generate Long-Lived Refresh Token (To keep user logged in)
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { _id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};

export const User = mongoose.model("User", userSchema);