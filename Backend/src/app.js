import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


// this line creates the express app
// like means start a web server and give me something to control it like app
// app is an object
// Receives incoming HTTP requests (like from a browser)
// Decides what to do with them
// Sends responses back
// we ceate only one express installs that controlls our whole and everything in our server
const app = express();

// app.use => middlewares
// cors is basically the middleware that controls who can access the backend form the browser
// origin = scheme + host + port 
//        = http://aniket.com:8000
//like means which frontend server can acces the backend
// we cannot use the '*' when we include credentials
// * means anyone can access the backend 
app.use(cors({
    origin: process.env.CORS_ORIGIN === "*" ? "*" : process.env.CORS_ORIGIN,
    credentials: true
}));

// client sends the json data via http request 
// http uses the tcp under the hood 
// means the data is being sent in form of chunk
// Node.js receives request body as a stream (chunk by chunk)
// We collect data as:
/*
req.on("data", (chunk) => {
  //clientData += chunk; // chunk is Buffer, converted to string
});
*/
//When all data is received:
/*
req.on("end", () => {
  req.body = JSON.parse(clientData); // convert string → object
});
*/
// this is the internal work of the express.json() 
// works only if Content-Type is 'application/json'
// without the express.json() req.body is undefined
app.use(express.json({ limit: "16kb" }));

//express.urlencoded() parses form-encoded data (key=value&key=value) into req.body.
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//express.static("public") serves files from the public folder directly via URL.
app.use(express.static("public"));

// cookieParser() reads cookies from request headers and makes them available as req.cookies.xyz
app.use(cookieParser());

app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

import userRouter from "./routes/user.route.js";
import problemRouter from "./routes/problem.route.js";
import submissionRouter from "./routes/submission.route.js";
import contestRouter from "./routes/contest.route.js";
app.use("/api/v1/users", userRouter);
app.use("/api/v1/problems", problemRouter);
app.use("/api/v1/submissions", submissionRouter);
app.use("/api/v1/contests", contestRouter);
export { app };