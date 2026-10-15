import { z } from "zod";

import Comment from "../models/Comment.js";
import Ticket from "../models/Ticket.js";
import User from "../models/User.js";

const ticketSchema = z.object({
    title: z.string().trim().min(3).max(150),
    description: z.string().trim().min(10).max(5000),
});

const commentSchema = z.object({
    message: z.string().trim().min(1).max(5000),
});

const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];

const isAdmin = (user) => user.role === "ADMIN";

// Create a ticket
export const createTicket = async (req, res) => {
    try {
        const validation = ticketSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid ticket information.",
                errors: validation.error.flatten().fieldErrors,
            });
        }

        const ticket = await Ticket.create({
            ...validation.data,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            message: "Ticket created successfully.",
            ticket,
        });
    } catch (error) {
        console.error("Create ticket error:", error.message);

        return res.status(500).json({
            message: "Unable to create ticket.",
        });
    }
};

// List tickets with search, status filtering, and pagination
export const getTickets = async (req, res) => {
    try {
        const { search = "", status, page = "1", limit = "10" } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            !Number.isInteger(pageSize) ||
            pageNumber < 1 ||
            pageSize < 1 ||
            pageSize > 100
        ) {
            return res.status(400).json({
                message: "Invalid pagination parameters.",
            });
        }

        if (status && !statuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid ticket status.",
            });
        }

        const filter = {};

        // Regular users can only see their own tickets.
        if (!isAdmin(req.user)) {
            filter.createdBy = req.user._id;
        }

        if (status) {
            filter.status = status;
        }

        if (search.trim()) {
            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.title = {
                $regex: escapedSearch,
                $options: "i",
            };
        }

        const [tickets, total] = await Promise.all([
            Ticket.find(filter)
                .populate("createdBy", "name email")
                .populate("assignedTo", "name email")
                .sort({ updatedAt: -1 })
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize),

            Ticket.countDocuments(filter),
        ]);

        return res.json({
            tickets,
            pagination: {
                page: pageNumber,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        console.error("Get tickets error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve tickets.",
        });
    }
};

// Get a single ticket
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate("createdBy", "name email")
            .populate("assignedTo", "name email");

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found.",
            });
        }

        if (
            !isAdmin(req.user) &&
            ticket.createdBy._id.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You cannot access this ticket.",
            });
        }

        return res.json({ ticket });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid ticket ID.",
            });
        }

        console.error("Get ticket error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve ticket.",
        });
    }
};

// Update ticket status
export const updateTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!statuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid ticket status.",
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found.",
            });
        }

        if (isAdmin(req.user)) {
            ticket.status = status;
        } else {
            // Users may close their own tickets only.
            if (ticket.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    message: "You cannot modify this ticket.",
                });
            }

            if (status !== "CLOSED") {
                return res.status(403).json({
                    message: "Users can only close their own tickets.",
                });
            }

            ticket.status = "CLOSED";
        }

        await ticket.save();

        return res.json({
            message: "Ticket status updated successfully.",
            ticket,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid ticket ID.",
            });
        }

        console.error("Update status error:", error.message);

        return res.status(500).json({
            message: "Unable to update ticket status.",
        });
    }
};

// Assign a ticket to a user
export const assignTicket = async (req, res) => {
    try {
        const { assignedTo } = req.body;

        if (
            assignedTo !== null &&
            (typeof assignedTo !== "string" ||
                !/^[a-f\d]{24}$/i.test(assignedTo))
        ) {
            return res.status(400).json({
                message: "Invalid assignee ID.",
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found.",
            });
        }

        if (assignedTo === null) {
            ticket.assignedTo = null;
        } else {
            const assignee = await User.findById(assignedTo);

            if (!assignee || !assignee.isActive) {
                return res.status(400).json({
                    message: "Assignee does not exist or is inactive.",
                });
            }

            ticket.assignedTo = assignee._id;
        }

        await ticket.save();

        await ticket.populate("assignedTo", "name email");

        return res.json({
            message: "Ticket assignment updated successfully.",
            ticket,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid ticket ID.",
            });
        }

        console.error("Assign ticket error:", error.message);

        return res.status(500).json({
            message: "Unable to assign ticket.",
        });
    }
};

// Add a comment to a ticket
export const addComment = async (req, res) => {
    try {
        const validation = commentSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Invalid comment.",
                errors: validation.error.flatten().fieldErrors,
            });
        }

        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found.",
            });
        }

        if (
            !isAdmin(req.user) &&
            ticket.createdBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You cannot comment on this ticket.",
            });
        }

        if (ticket.status === "CLOSED") {
            return res.status(400).json({
                message: "Cannot comment on a closed ticket.",
            });
        }

        const comment = await Comment.create({
            ticket: ticket._id,
            author: req.user._id,
            message: validation.data.message,
        });

        await comment.populate("author", "name email");

        return res.status(201).json({
            message: "Comment added successfully.",
            comment,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid ticket ID.",
            });
        }

        console.error("Add comment error:", error.message);

        return res.status(500).json({
            message: "Unable to add comment.",
        });
    }
};

// List comments for a ticket
export const getComments = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                message: "Ticket not found.",
            });
        }

        if (
            !isAdmin(req.user) &&
            ticket.createdBy.toString() !== req.user._id.toString()
        ) {
            return res.status(403).json({
                message: "You cannot access these comments.",
            });
        }

        const comments = await Comment.find({
            ticket: ticket._id,
        })
            .populate("author", "name email")
            .sort({ createdAt: 1 });

        return res.json({ comments });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({
                message: "Invalid ticket ID.",
            });
        }

        console.error("Get comments error:", error.message);

        return res.status(500).json({
            message: "Unable to retrieve comments.",
        });
    }
};
