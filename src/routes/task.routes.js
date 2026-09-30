import { Router } from "express";
import {
    getProjectTasks,
    createTask,
    getTaskById,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
} from "../controllers/task.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getProjectRole,
    isProjectAdminOrAdmin,
} from "../middlewares/role.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

// Task routes
router
    .route("/:projectId")
    .get(getProjectRole, getProjectTasks)
    .post(getProjectRole, isProjectAdminOrAdmin, upload.array("attachments", 5), createTask);

router
    .route("/:projectId/t/:taskId")
    .get(getProjectRole, getTaskById)
    .put(getProjectRole, isProjectAdminOrAdmin, upload.array("attachments", 5), updateTask)
    .delete(getProjectRole, isProjectAdminOrAdmin, deleteTask);

// Subtask routes
router
    .route("/:projectId/t/:taskId/subtasks")
    .post(getProjectRole, isProjectAdminOrAdmin, createSubTask);

router
    .route("/:projectId/st/:subTaskId")
    .put(getProjectRole, updateSubTask)         // all roles can toggle completion
    .delete(getProjectRole, isProjectAdminOrAdmin, deleteSubTask);

export default router;
