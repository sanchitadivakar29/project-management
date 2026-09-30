import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { APIerror } from "../utils/apierrors.js";
import { asyncHandler } from "../utils/asynchandller.js";

// Verify JWT and attach user to request
export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new APIerror(401, "Unauthorized request");
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
        throw new APIerror(401, "Invalid or expired access token");
    }

    const user = await User.findById(decoded._id).select(
        "-password -refreshToken"
    );

    if (!user) {
        throw new APIerror(401, "User not found");
    }

    req.user = user;
    next();
});
