import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

import {
    addComment,
    assignTicket,
    createTicket,
    getComments,
    getTicketById,
    getTickets,
    updateTicketStatus,
} from "../controllers/ticket.controller.js";

const router = Router();

// All ticket endpoints require authentication.
router.use(authenticate);

// Create and list tickets.
router.post("/", createTicket);
router.get("/", getTickets);

// Ticket details.
router.get("/:id", getTicketById);

// Ticket updates.
router.patch("/:id/status", updateTicketStatus);

// Only admins can assign tickets.
router.patch("/:id/assign", authorize("ADMIN"), assignTicket);

// Comments.
router.post("/:id/comments", addComment);
router.get("/:id/comments", getComments);

export default router;
