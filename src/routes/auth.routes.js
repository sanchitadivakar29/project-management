import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    getCurrentUser,
    changePassword,
    refreshAccessToken,
    verifyEmail,
    forgotPassword,
    resetPassword,
    resendEmailVerification,
} from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.get("/current-user", verifyJWT, getCurrentUser);
router.post("/change-password", verifyJWT, changePassword);
router.post("/refresh-token", refreshAccessToken);
router.get("/verify-email/:verificationToken", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:resetToken", resetPassword);
router.post("/resend-email-verification", verifyJWT, resendEmailVerification);

export default router;
