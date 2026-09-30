import { Project } from "../models/project.model.js";
import { User } from "../models/user.model.js";
import { APIerror } from "../utils/apierrors.js";
import { APIresponse } from "../utils/apiresponse.js";
import { asyncHandler } from "../utils/asynchandller.js";
import { UserRoleEnum } from "../utils/constants.js";

// GET /api/v1/projects/  - List all projects for the current user
export const getUserProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find({
        "members.user": req.user._id,
    }).populate("createdBy", "username email");

    // Add member count to each project
    const result = projects.map((p) => ({
        _id: p._id,
        name: p.name,
        description: p.description,
        createdBy: p.createdBy,
        memberCount: p.members.length,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
    }));

    return res
        .status(200)
        .json(new APIresponse(200, result, "Projects fetched successfully"));
});

// POST /api/v1/projects/  - Create a new project
export const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        throw new APIerror(400, "Project name is required");
    }

    const project = await Project.create({
        name,
        description,
        createdBy: req.user._id,
        members: [{ user: req.user._id, role: UserRoleEnum.ADMIN }],
    });

    return res
        .status(201)
        .json(new APIresponse(201, project, "Project created successfully"));
});

// GET /api/v1/projects/:projectId  - Get project details
export const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId)
        .populate("createdBy", "username email")
        .populate("members.user", "username email");

    return res
        .status(200)
        .json(new APIresponse(200, project, "Project fetched successfully"));
});

// PUT /api/v1/projects/:projectId  - Update project (admin only)
export const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.findByIdAndUpdate(
        req.params.projectId,
        { $set: { name, description } },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(new APIresponse(200, project, "Project updated successfully"));
});

// DELETE /api/v1/projects/:projectId  - Delete project (admin only)
export const deleteProject = asyncHandler(async (req, res) => {
    await Project.findByIdAndDelete(req.params.projectId);

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Project deleted successfully"));
});

// GET /api/v1/projects/:projectId/members  - List members
export const getProjectMembers = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.projectId).populate(
        "members.user",
        "username email"
    );

    return res
        .status(200)
        .json(new APIresponse(200, project.members, "Members fetched successfully"));
});

// POST /api/v1/projects/:projectId/members  - Add member by email (admin only)
export const addProjectMember = asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    if (!email) {
        throw new APIerror(400, "Email is required");
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw new APIerror(404, "No user found with this email");
    }

    const project = req.project;

    const alreadyMember = project.members.find(
        (m) => m.user.toString() === user._id.toString()
    );
    if (alreadyMember) {
        throw new APIerror(409, "User is already a member of this project");
    }

    project.members.push({
        user: user._id,
        role: role || UserRoleEnum.MEMBER,
    });
    await project.save();

    return res
        .status(201)
        .json(new APIresponse(201, {}, "Member added successfully"));
});

// PUT /api/v1/projects/:projectId/members/:userId  - Update member role (admin only)
export const updateMemberRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
        throw new APIerror(400, "Role is required");
    }

    const project = req.project;

    const member = project.members.find(
        (m) => m.user.toString() === userId
    );
    if (!member) {
        throw new APIerror(404, "Member not found in this project");
    }

    member.role = role;
    await project.save();

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Member role updated successfully"));
});

// DELETE /api/v1/projects/:projectId/members/:userId  - Remove member (admin only)
export const removeProjectMember = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const project = req.project;

    const memberIndex = project.members.findIndex(
        (m) => m.user.toString() === userId
    );
    if (memberIndex === -1) {
        throw new APIerror(404, "Member not found in this project");
    }

    // Prevent removing the only admin
    if (project.members[memberIndex].role === UserRoleEnum.ADMIN) {
        const adminCount = project.members.filter(
            (m) => m.role === UserRoleEnum.ADMIN
        ).length;
        if (adminCount <= 1) {
            throw new APIerror(400, "Cannot remove the only admin from the project");
        }
    }

    project.members.splice(memberIndex, 1);
    await project.save();

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Member removed successfully"));
});
