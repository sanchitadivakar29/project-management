import { APIerror } from "../utils/apierrors.js";

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error("ERROR:", err.stack || err.message || err);
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    let errors = err.errors || [];

    // Handle Mongoose validation errors
    if (err.name === "ValidationError") {
        statusCode = 422;
        message = "Validation Error";
        errors = Object.values(err.errors).map((e) => e.message);
    }

    // Handle Mongoose cast errors (invalid ObjectId)
    if (err.name === "CastError") {
        statusCode = 400;
        message = "Invalid ID format";
    }

    // Handle duplicate key errors
    if (err.code === 11000) {
        statusCode = 409;
        message = `Duplicate value for ${Object.keys(err.keyValue).join(", ")}`;
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        errors,
    });
};

export { errorHandler };
