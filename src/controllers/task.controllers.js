import { Task } from "../models/task.model.js";
import { APIerror } from "../utils/apierrors.js";
import { APIresponse } from "../utils/apiresponse.js";
import { asyncHandler } from "../utils/asynchandller.js";
import { TaskStatusEnum } from "../utils/constants.js";

// GET /api/v1/tasks/:projectId  - List tasks in a project
export const getProjectTasks = asyncHandler(async (req, res) => {
    const tasks = await Task.find({ project: req.params.projectId })
        .populate("assignedTo", "username email")
        .populate("assignedBy", "username email");

    return res
        .status(200)
        .json(new APIresponse(200, tasks, "Tasks fetched successfully"));
});

// POST /api/v1/tasks/:projectId  - Create a task (admin / project_admin only)
export const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;

    if (!title) {
        throw new APIerror(400, "Task title is required");
    }

    // Build attachments from uploaded files
    const attachments = (req.files || []).map((file) => ({
        url: `/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));

    const task = await Task.create({
        title,
        description,
        project: req.params.projectId,
        assignedTo: assignedTo || null,
        assignedBy: req.user._id,
        status: status || TaskStatusEnum.TODO,
        attachments,
    });

    return res
        .status(201)
        .json(new APIresponse(201, task, "Task created successfully"));
});

// GET /api/v1/tasks/:projectId/t/:taskId  - Get a single task
export const getTaskById = asyncHandler(async (req, res) => {
    const task = await Task.findOne({
        _id: req.params.taskId,
        project: req.params.projectId,
    })
        .populate("assignedTo", "username email")
        .populate("assignedBy", "username email")
        .populate("subTasks.createdBy", "username email");

    if (!task) {
        throw new APIerror(404, "Task not found");
    }

    return res
        .status(200)
        .json(new APIresponse(200, task, "Task fetched successfully"));
});

// PUT /api/v1/tasks/:projectId/t/:taskId  - Update a task (admin / project_admin only)
export const updateTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;

    const task = await Task.findOne({
        _id: req.params.taskId,
        project: req.params.projectId,
    });

    if (!task) {
        throw new APIerror(404, "Task not found");
    }

    // Add any new uploaded files to existing attachments
    const newAttachments = (req.files || []).map((file) => ({
        url: `/images/${file.filename}`,
        mimetype: file.mimetype,
        size: file.size,
    }));

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignedTo !== undefined) task.assignedTo = assignedTo;
    if (status !== undefined) task.status = status;
    task.attachments.push(...newAttachments);

    await task.save();

    return res
        .status(200)
        .json(new APIresponse(200, task, "Task updated successfully"));
});

// DELETE /api/v1/tasks/:projectId/t/:taskId  - Delete a task (admin / project_admin only)
export const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findOneAndDelete({
        _id: req.params.taskId,
        project: req.params.projectId,
    });

    if (!task) {
        throw new APIerror(404, "Task not found");
    }

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Task deleted successfully"));
});

// POST /api/v1/tasks/:projectId/t/:taskId/subtasks  - Create subtask (admin / project_admin only)
export const createSubTask = asyncHandler(async (req, res) => {
    const { title } = req.body;

    if (!title) {
        throw new APIerror(400, "Subtask title is required");
    }

    const task = await Task.findOne({
        _id: req.params.taskId,
        project: req.params.projectId,
    });

    if (!task) {
        throw new APIerror(404, "Task not found");
    }

    task.subTasks.push({ title, createdBy: req.user._id });
    await task.save();

    return res
        .status(201)
        .json(new APIresponse(201, task.subTasks, "Subtask created successfully"));
});

// PUT /api/v1/tasks/:projectId/st/:subTaskId  - Update subtask (all roles; members can only toggle isCompleted)
export const updateSubTask = asyncHandler(async (req, res) => {
    const { title, isCompleted } = req.body;

    // Find the task that contains this subtask
    const task = await Task.findOne({
        project: req.params.projectId,
        "subTasks._id": req.params.subTaskId,
    });

    if (!task) {
        throw new APIerror(404, "Subtask not found");
    }

    const subTask = task.subTasks.id(req.params.subTaskId);

    // Members can only toggle completion
    if (title !== undefined) subTask.title = title;
    if (isCompleted !== undefined) subTask.isCompleted = isCompleted;

    await task.save();

    return res
        .status(200)
        .json(new APIresponse(200, subTask, "Subtask updated successfully"));
});

// DELETE /api/v1/tasks/:projectId/st/:subTaskId  - Delete subtask (admin / project_admin only)
export const deleteSubTask = asyncHandler(async (req, res) => {
    const task = await Task.findOne({
        project: req.params.projectId,
        "subTasks._id": req.params.subTaskId,
    });

    if (!task) {
        throw new APIerror(404, "Subtask not found");
    }

    task.subTasks.pull({ _id: req.params.subTaskId });
    await task.save();

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Subtask deleted successfully"));
});
