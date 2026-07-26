import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
dotenv.config({
    path: "./.env"
});
const PORT = process.env.PORT || 8000;
process.on("uncaughtException", (err) => {
    console.error("CRITICAL: Uncaught Exception thrown: ", err);
    process.exit(1);
});
connectDB()
    .then(() => {
        const server = app.listen(PORT, () => {
            console.log(`EngineX Gateway listening live at: http://localhost:${PORT}`);
        });
        process.on("unhandledRejection", (err) => {
            console.error("CRITICAL: Unhandled Promise Rejection detected: ", err);
            server.close(() => process.exit(1));
        });
    })
    .catch((error) => {
        console.error("EngineX initialization sequence aborted: ", error);
    });