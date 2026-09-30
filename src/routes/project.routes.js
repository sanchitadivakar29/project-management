import { Router } from "express";
import {
    getUserProjects,
    createProject,
    getProjectById,
    updateProject,
    deleteProject,
    getProjectMembers,
    addProjectMember,
    updateMemberRole,
    removeProjectMember,
} from "../controllers/project.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getProjectRole,
    isProjectAdmin,
} from "../middlewares/role.middleware.js";

const router = Router();

// All project routes require authentication
router.use(verifyJWT);

router.route("/").get(getUserProjects).post(createProject);

router
    .route("/:projectId")
    .get(getProjectRole, getProjectById)
    .put(getProjectRole, isProjectAdmin, updateProject)
    .delete(getProjectRole, isProjectAdmin, deleteProject);

router
    .route("/:projectId/members")
    .get(getProjectRole, getProjectMembers)
    .post(getProjectRole, isProjectAdmin, addProjectMember);

router
    .route("/:projectId/members/:userId")
    .put(getProjectRole, isProjectAdmin, updateMemberRole)
    .delete(getProjectRole, isProjectAdmin, removeProjectMember);

export default router;
