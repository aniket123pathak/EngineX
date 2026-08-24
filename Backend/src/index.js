import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: "./.env"
});
const PORT = process.env.PORT || 8000;

//Handles synchronous errors that were NOT caught anywhere
// there errros are not cught by the normal tru catch or any other traditional method
// like example 
/*
function a() {
  b();
}
function b() {
  c();
}
function c() {
  throw new Error("Boom!");
}
a();
here in this program the error is uncatched menas 
when a program throws an error it satrts to unwind the call stack to find the CATCH block 
like here function c will throw an error it is not handled in the fucntion c
then it goes to function b not handled here also
then it goes to function a not handeled here 
then it goes to gloabl there also not handled so this is an uncaught exception this can only be caught by
process.on("uncaughtExceotion")
*/ 

//Validation / try-catch → security guard stopping issues at the gate
//uncaughtException → emergency shutdown when building is on fire

// If a user can cause it → you MUST handle it locally
// If only a bug can cause it → global handler is acceptable
process.on("uncaughtException", (err) => {
    console.error("CRITICAL: Uncaught Exception thrown: ", err);
    process.exit(1);
});


connectDB()
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`EngineX Gateway listening live at: http://localhost:${PORT}`);
        });
        // this handlels unhandlesPromices like example if any promice gets rejected but we didnt caught
        // caught the promise that are not handled
        process.on("unhandledRejection", (err) => {
            console.error("CRITICAL: Unhandled Promise Rejection detected: ", err);
            server.close(() => process.exit(1));
        });
    })
    .catch((error) => {
        console.error("EngineX initialization sequence aborted: ", error);
    });