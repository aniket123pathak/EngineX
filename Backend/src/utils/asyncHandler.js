const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };
};
export { asyncHandler };

/*
so here our requestHandler is this function 

async (req, res) => {
    const { username, email, password } = req.body;
    if (
        [username, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields (username, email, password) are required");
    }
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });
    if (existedUser) {
        throw new ApiError(409, "A user with this email or username already exists");
    }
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password, 
    });
    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user in the database");
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
}


so asynchandler is returning a function. example name Wrapper

const wrapper = (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };  => this is wrapper

so means 
registeruser = wrapper(req,res,next);
similar 
registerUser = (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err));
    };


    and what is requestHandler here is our controller

    now the flow..
    someone wants register..
    registerUser get called with req,res,next...

    requestHandler is the async function so it will return a promise...
    if we threow an error from function promise will go to the rejected state...
    and catch is called and next(err) means the rejected promise handling function will get called
    


*/