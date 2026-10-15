import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        ticket: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Ticket",
            required: true,
            index: true,
        },

        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000,
        },
    },
    {
        timestamps: true,
    },
);

export default mongoose.model("Comment", commentSchema);
