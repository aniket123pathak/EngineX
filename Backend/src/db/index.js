import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`MONGODB connected !!! Database Host : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MongoDB connection failed !!",error)
    }
}
export default connectDB