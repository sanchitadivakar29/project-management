import { Router } from "express";
import {
    getProjectNotes,
    createNote,
    getNoteById,
    updateNote,
    deleteNote,
} from "../controllers/note.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getProjectRole,
    isProjectAdmin,
} from "../middlewares/role.middleware.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/:projectId")
    .get(getProjectRole, getProjectNotes)
    .post(getProjectRole, isProjectAdmin, createNote);

router
    .route("/:projectId/n/:noteId")
    .get(getProjectRole, getNoteById)
    .put(getProjectRole, isProjectAdmin, updateNote)
    .delete(getProjectRole, isProjectAdmin, deleteNote);

export default router;
