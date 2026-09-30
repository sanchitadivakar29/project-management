import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { APIerror } from "../utils/apierrors.js";
import { APIresponse } from "../utils/apiresponse.js";
import { asyncHandler } from "../utils/asynchandller.js";
import {
    sendEmail,
    emailVerificationTemplate,
    forgotPasswordTemplate,
} from "../utils/mail.js";

// Helper: generate tokens and save refresh token to DB
const generateTokens = async (userId) => {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
};

// Cookie options
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
};

// POST /api/v1/auth/register
export const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        throw new APIerror(400, "Username, email and password are required");
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        throw new APIerror(409, "User with this email or username already exists");
    }

    const user = await User.create({ username, email, password });

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const verificationLink = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;
    const template = emailVerificationTemplate(user.username, verificationLink);
    await sendEmail({ to: user.email, ...template });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -forgotPasswordToken"
    );

    return res
        .status(201)
        .json(new APIresponse(201, createdUser, "User registered successfully. Please verify your email."));
});

// POST /api/v1/auth/login
export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new APIerror(400, "Email and password are required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new APIerror(401, "Invalid email or password");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new APIerror(401, "Invalid email or password");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -forgotPasswordToken"
    );

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new APIresponse(200, { user: loggedInUser, accessToken, refreshToken }, "Login successful")
        );
});

// POST /api/v1/auth/logout
export const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

    return res
        .status(200)
        .clearCookie("accessToken", cookieOptions)
        .clearCookie("refreshToken", cookieOptions)
        .json(new APIresponse(200, {}, "Logged out successfully"));
});

// GET /api/v1/auth/current-user
export const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new APIresponse(200, req.user, "Current user fetched successfully"));
});

// POST /api/v1/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new APIerror(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user._id);
    const isValid = await user.isPasswordCorrect(oldPassword);
    if (!isValid) {
        throw new APIerror(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Password changed successfully"));
});

// POST /api/v1/auth/refresh-token
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new APIerror(401, "Refresh token is required");
    }

    let decoded;
    try {
        decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    } catch (err) {
        throw new APIerror(401, "Invalid or expired refresh token");
    }

    const user = await User.findById(decoded._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
        throw new APIerror(401, "Refresh token has been used or is invalid");
    }

    const { accessToken, refreshToken } = await generateTokens(user._id);

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(new APIresponse(200, { accessToken, refreshToken }, "Access token refreshed"));
});

// GET /api/v1/auth/verify-email/:verificationToken
export const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        throw new APIerror(400, "Verification token is required");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new APIerror(400, "Invalid or expired verification token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Email verified successfully"));
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new APIerror(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        // Return success even if user not found to prevent email enumeration
        return res
            .status(200)
            .json(new APIresponse(200, {}, "If this email exists, a reset link has been sent"));
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const resetLink = `${req.protocol}://${req.get("host")}/api/v1/auth/reset-password/${unHashedToken}`;
    const template = forgotPasswordTemplate(user.username, resetLink);
    await sendEmail({ to: user.email, ...template });

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Password reset email sent"));
});

// POST /api/v1/auth/reset-password/:resetToken
export const resetPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        throw new APIerror(400, "New password is required");
    }

    const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new APIerror(400, "Invalid or expired reset token");
    }

    user.password = newPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Password reset successfully"));
});

// POST /api/v1/auth/resend-email-verification
export const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user.isEmailVerified) {
        throw new APIerror(400, "Email is already verified");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    const verificationLink = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;
    const template = emailVerificationTemplate(user.username, verificationLink);
    await sendEmail({ to: user.email, ...template });

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Verification email resent successfully"));
});
