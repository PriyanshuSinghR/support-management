import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

import User from "../models/User.js";

const loginSchema = z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
});

export const login = async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                message: "Please provide a valid email and password.",
            });
        }

        const { email, password } = validation.data;

        const user = await User.findOne({
            email: email.toLowerCase(),
        }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                message: "Your account has been deactivated.",
            });
        }

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) {
            return res.status(401).json({
                message: "Invalid email or password.",
            });
        }

        const token = jwt.sign(
            { userId: user._id.toString() },
            process.env.JWT_SECRET,
            { expiresIn: "1h" },
        );

        return res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);

        return res.status(500).json({
            message: "Unable to log in. Please try again.",
        });
    }
};
