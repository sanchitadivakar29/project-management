import mongoose from "mongoose";
import dns from "node:dns";


dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {

    try {
        const mongoURI = process.env.MONGO_DB || process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error("MongoDB connection URI not found in environment variables (MONGO_DB or MONGODB_URI)");
        }
        if (mongoURI.includes("<db_password>") || mongoURI.includes("<password>")) {
            throw new Error("Please replace the placeholder '<db_password>' with your actual MongoDB user password in your .env file.");
        }
        const connectionInstance = await mongoose.connect(mongoURI);
        console.log(`\n MongoDB connected successfully! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error:", error.message || error);
        process.exit(1);
    }
};

export default connectDB;

