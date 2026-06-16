// src/controllers/user.controller.js
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

// src/controllers/user.controller.js (Add this at the top, below imports)

/**
 * HELPER: Generate Access and Refresh Tokens
 * Why a helper? Because we will need to generate tokens during Login, 
 * and also when a user requests a new token (Refresh). DRY principle.
 */
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save the refresh token to the database so we can track valid sessions
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false }); // Skip full validation (like password checks) here

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating the auth tokens");
    }
};


/**
 * WORKFLOW: USER REGISTRATION
 * 1. Get user details from the frontend (req.body)
 * 2. Validation: Check if the fields are empty
 * 3. Database Check: See if a user with that email or username already exists
 * 4. Create: Save the user to the database
 * 5. Sanitize: Remove the password from the response object (Security!)
 * 6. Respond: Send a clean JSON response back to the frontend
 */

export const registerUser = asyncHandler(async (req, res) => {
    // STEP 1: Extract data from the incoming request body
    const { username, email, password } = req.body;

    // STEP 2: Validation
    // If any of these are missing or just empty spaces, throw our custom ApiError.
    // Notice how throwing ApiError automatically stops the function and sends a 400 status.
    if (
        [username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields (username, email, password) are required");
    }

    // STEP 3: Database Check
    // We query MongoDB to see if this user already exists.
    // The $or operator checks if EITHER the username OR the email matches.
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "A user with this email or username already exists");
    }

    // STEP 4: Create User
    // We pass the raw password here. Remember our Mongoose pre-save hook?
    // It will intercept this, hash the password securely, and THEN save it.
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password, 
    });

    // STEP 5: Sanitize Output
    // We successfully created the user, but we MUST NOT send the password back to the frontend.
    // We query the database to get the user we just created, but we use .select("-password")
    // The minus sign tells MongoDB: "Give me everything EXCEPT the password".
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    // Double check that Mongoose actually created the document
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user in the database");
    }

    // STEP 6: Respond
    // Use our standardized ApiResponse class. The frontend will always receive:
    // { statusCode: 201, data: { user details }, message: "...", success: true }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

// src/controllers/user.controller.js (Add this at the bottom)

/**
 * WORKFLOW: USER LOGIN
 * 1. Get username/email and password from frontend.
 * 2. Find the user in the database.
 * 3. Verify the password using our custom model method.
 * 4. Generate Access and Refresh Tokens.
 * 5. Send tokens to the user via SECURE COOKIES (Not in the JSON body!).
 */
export const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // 1. Ensure they provided a password and at least an email or username
    if (!password || (!username && !email)) {
        throw new ApiError(400, "Username or Email, and Password are required");
    }

    // 2. Find the user
    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // 3. Verify the password
    // We use the custom method we wrote in user.model.js
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // 4. Generate Tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // 5. Setup Secure Cookies
    // httpOnly: true -> Frontend JavaScript CANNOT read this cookie. Prevents XSS attacks.
    // secure: true -> Cookie is only sent over HTTPS.
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", 
    };

    // Sanitize user object before sending it to the frontend
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // 6. Respond with Cookies AND JSON
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                { user: loggedInUser, accessToken, refreshToken }, 
                "User logged in successfully"
            )
        );
});

// src/controllers/user.controller.js (Add to the bottom)

/**
 * WORKFLOW: USER LOGOUT
 * 1. Identify the user (our verifyJWT middleware already did this and attached req.user!)
 * 2. Find the user in the DB and remove their refresh token.
 * 3. Instruct the browser to delete the secure cookies.
 */
export const logoutUser = asyncHandler(async (req, res) => {
    // 1. We have access to req.user._id because the verifyJWT middleware put it there
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // This removes the field from the document
            }
        },
        {
            new: true // Returns the updated document
        }
    );

    // 2. Define the exact same cookie options we used during login
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    };

    // 3. Clear the cookies and send the response
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});