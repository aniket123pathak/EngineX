import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
// using async fucntion cause database connection may cause delay or it takes time so it should be handled asynchronously
const connectDB = async () => {
    //normal try catch syntax for catching the erros in the connection with DB
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`\nMongoDB connected successfully! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error: ", error);
        process.exit(1);// exiting instantly cause .....may cause db inconsistancy it process continues
    }
};
export default connectDB;