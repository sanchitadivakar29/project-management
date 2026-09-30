import { Project } from "../models/project.model.js";
import { APIerror } from "../utils/apierrors.js";
import { asyncHandler } from "../utils/asynchandller.js";
import { UserRoleEnum } from "../utils/constants.js";

// Get the current user's role inside the project and attach it to req
export const getProjectRole = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
        throw new APIerror(404, "Project not found");
    }

    const member = project.members.find(
        (m) => m.user.toString() === req.user._id.toString()
    );

    if (!member) {
        throw new APIerror(403, "You are not a member of this project");
    }

    req.project = project;
    req.userRole = member.role;
    next();
});

// Allow only admins (project creator / admin role)
export const isProjectAdmin = asyncHandler(async (req, res, next) => {
    if (req.userRole !== UserRoleEnum.ADMIN) {
        throw new APIerror(403, "Only project admins can perform this action");
    }
    next();
});

// Allow admins and project_admins
export const isProjectAdminOrAdmin = asyncHandler(async (req, res, next) => {
    if (
        req.userRole !== UserRoleEnum.ADMIN &&
        req.userRole !== UserRoleEnum.PROJECT_ADMIN
    ) {
        throw new APIerror(403, "You don't have permission to perform this action");
    }
    next();
});
