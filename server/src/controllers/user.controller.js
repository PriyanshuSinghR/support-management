import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { z } from "zod";
import User from "../models/User.js";

const userSchema = z.object({
    name: z.string().trim().min(2).max(100),
    email: z
        .string()
        .trim()
        .email()
        .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(128),
    role: z.enum(["ADMIN", "USER"]).default("USER"),
});

const updateUserSchema = z
    .object({
        name: z.string().trim().min(2).max(100).optional(),
        email: z
            .string()
            .trim()
            .email()
            .transform((value) => value.toLowerCase())
            .optional(),
        role: z.enum(["ADMIN", "USER"]).optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Provide at least one field to update",
    });

const publicUserFields = "name email role isActive createdAt updatedAt";

function isDuplicateEmail(error) {
    return error?.code === 11000;
}

function sendError(res, error) {
    if (error instanceof z.ZodError) {
        return res.status(400).json({
            message: "Validation failed",
            errors: error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
    }

    if (isDuplicateEmail(error)) {
        return res.status(409).json({
            message: "An account with this email already exists",
        });
    }

    console.error(error);

    return res.status(500).json({
        message: "An unexpected server error occurred",
    });
}

// GET /api/users/me
export async function getMyProfile(req, res) {
    try {
        const user = await User.findById(req.user._id).select(publicUserFields);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({ user });
    } catch (error) {
        return sendError(res, error);
    }
}

// PATCH /api/users/me
export async function updateMyProfile(req, res) {
    try {
        const schema = z
            .object({
                name: z.string().trim().min(2).max(100).optional(),
            })
            .refine((data) => Object.keys(data).length > 0, {
                message: "Provide a name to update",
            });

        const updates = schema.parse(req.body);

        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true },
        ).select(publicUserFields);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            message: "Profile updated successfully",
            user,
        });
    } catch (error) {
        return sendError(res, error);
    }
}

// GET /api/users
// Admin only
export async function getUsers(req, res) {
    try {
        const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.limit, 10) || 10),
        );

        const filter = {};

        if (req.query.search) {
            const search = String(req.query.search).trim().slice(0, 100);
            const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.$or = [
                { name: { $regex: escaped, $options: "i" } },
                { email: { $regex: escaped, $options: "i" } },
            ];
        }

        if (["ADMIN", "USER"].includes(req.query.role)) {
            filter.role = req.query.role;
        }

        if (req.query.active === "true") filter.isActive = true;
        if (req.query.active === "false") filter.isActive = false;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select(publicUserFields)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        return res.json({
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return sendError(res, error);
    }
}

// POST /api/users
// Admin only
export async function createUser(req, res) {
    try {
        const data = userSchema.parse(req.body);

        const existingUser = await User.findOne({ email: data.email });

        if (existingUser) {
            return res.status(409).json({
                message: "An account with this email already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(data.password, 12);

        const user = await User.create({
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
        });

        return res.status(201).json({
            message: "User created successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        return sendError(res, error);
    }
}

// PATCH /api/users/:id
// Admin only
export async function updateUser(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const updates = updateUserSchema.parse(req.body);

        // Do not allow an admin to disable or demote their own account.
        if (String(req.user._id) === id) {
            if (updates.isActive === false || updates.role === "USER") {
                return res.status(400).json({
                    message: "You cannot deactivate or demote your own account",
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        ).select(publicUserFields);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json({
            message: "User updated successfully",
            user,
        });
    } catch (error) {
        return sendError(res, error);
    }
}

// PATCH /api/users/me/password
// Every authenticated user can change their own password.
export async function changeMyPassword(req, res) {
    try {
        const schema = z.object({
            currentPassword: z.string().min(1, "Current password is required"),
            newPassword: z
                .string()
                .min(8, "New password must contain at least 8 characters")
                .max(128, "New password cannot exceed 128 characters"),
        });

        const { currentPassword, newPassword } = schema.parse(req.body);

        const user = await User.findById(req.user._id).select("+password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            user.password,
        );

        if (!passwordMatches) {
            return res.status(400).json({
                message: "Your current password is incorrect.",
            });
        }

        const samePassword = await bcrypt.compare(newPassword, user.password);

        if (samePassword) {
            return res.status(400).json({
                message:
                    "Your new password must be different from your current password.",
            });
        }

        user.password = await bcrypt.hash(newPassword, 12);
        await user.save();

        return res.json({
            message: "Password changed successfully.",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation failed",
                errors: error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        console.error("Change password error:", error);

        return res.status(500).json({
            message: "Unable to change password.",
        });
    }
}

// PATCH /api/users/:id/password
// Admin only; password is never returned.
export async function resetUserPassword(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const schema = z.object({
            password: z.string().min(8).max(128),
        });

        const { password } = schema.parse(req.body);

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.password = await bcrypt.hash(password, 12);
        await user.save();

        return res.json({ message: "Password reset successfully" });
    } catch (error) {
        return sendError(res, error);
    }
}
