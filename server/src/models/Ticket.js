import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
            default: "OPEN",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Ticket", ticketSchema);
