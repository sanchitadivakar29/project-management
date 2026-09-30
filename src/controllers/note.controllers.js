import { Note } from "../models/note.model.js";
import { APIerror } from "../utils/apierrors.js";
import { APIresponse } from "../utils/apiresponse.js";
import { asyncHandler } from "../utils/asynchandller.js";

// GET /api/v1/notes/:projectId  - List all notes for a project
export const getProjectNotes = asyncHandler(async (req, res) => {
    const notes = await Note.find({ project: req.params.projectId })
        .populate("createdBy", "username email")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new APIresponse(200, notes, "Notes fetched successfully"));
});

// POST /api/v1/notes/:projectId  - Create a note (admin only)
export const createNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;

    if (!title) {
        throw new APIerror(400, "Note title is required");
    }

    const note = await Note.create({
        title,
        content,
        project: req.params.projectId,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new APIresponse(201, note, "Note created successfully"));
});

// GET /api/v1/notes/:projectId/n/:noteId  - Get a single note
export const getNoteById = asyncHandler(async (req, res) => {
    const note = await Note.findOne({
        _id: req.params.noteId,
        project: req.params.projectId,
    }).populate("createdBy", "username email");

    if (!note) {
        throw new APIerror(404, "Note not found");
    }

    return res
        .status(200)
        .json(new APIresponse(200, note, "Note fetched successfully"));
});

// PUT /api/v1/notes/:projectId/n/:noteId  - Update a note (admin only)
export const updateNote = asyncHandler(async (req, res) => {
    const { title, content } = req.body;

    const note = await Note.findOneAndUpdate(
        { _id: req.params.noteId, project: req.params.projectId },
        { $set: { title, content } },
        { new: true, runValidators: true }
    );

    if (!note) {
        throw new APIerror(404, "Note not found");
    }

    return res
        .status(200)
        .json(new APIresponse(200, note, "Note updated successfully"));
});

// DELETE /api/v1/notes/:projectId/n/:noteId  - Delete a note (admin only)
export const deleteNote = asyncHandler(async (req, res) => {
    const note = await Note.findOneAndDelete({
        _id: req.params.noteId,
        project: req.params.projectId,
    });

    if (!note) {
        throw new APIerror(404, "Note not found");
    }

    return res
        .status(200)
        .json(new APIresponse(200, {}, "Note deleted successfully"));
});
