import mongoose, { Schema } from "mongoose";
import { AvailableUserRole, UserRoleEnum } from "../utils/constants.js";

const projectMemberSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    role: {
        type: String,
        enum: AvailableUserRole,
        default: UserRoleEnum.MEMBER,
    },
});

const projectSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        members: {
            type: [projectMemberSchema],
            default: [],
        },
    },
    { timestamps: true }
);

export const Project = mongoose.model("Project", projectSchema);
