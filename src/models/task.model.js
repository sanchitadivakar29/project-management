import mongoose, { Schema } from "mongoose";
import { AvailableTaskStatus, TaskStatusEnum } from "../utils/constants.js";

const attachmentSchema = new Schema({
    url: { type: String, required: true },
    mimetype: { type: String },
    size: { type: Number },
});

const subTaskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        isCompleted: {
            type: Boolean,
            default: false,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const taskSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: "Project",
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        status: {
            type: String,
            enum: AvailableTaskStatus,
            default: TaskStatusEnum.TODO,
        },
        attachments: {
            type: [attachmentSchema],
            default: [],
        },
        subTasks: {
            type: [subTaskSchema],
            default: [],
        },
    },
    { timestamps: true }
);

export const Task = mongoose.model("Task", taskSchema);
