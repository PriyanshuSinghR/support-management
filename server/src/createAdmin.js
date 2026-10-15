import "dotenv/config";

import bcrypt from "bcryptjs";

import connectDB from "./config/db.js";
import User from "./models/User.js";

const createAdmin = async () => {
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error(
            "Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env",
        );
    }

    if (ADMIN_PASSWORD.length < 12) {
        throw new Error("Admin password must contain at least 12 characters.");
    }

    await connectDB();

    const email = ADMIN_EMAIL.trim().toLowerCase();

    const existingUser = await User.findOne({ email });

    if (existingUser) {
        throw new Error(
            "A user with this email already exists. No changes made.",
        );
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    await User.create({
        name: ADMIN_NAME.trim(),
        email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
    });

    console.log(`Admin account created for ${email}`);
};

createAdmin()
    .catch((error) => {
        console.error("Admin creation failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        const mongoose = await import("mongoose");
        await mongoose.default.disconnect();
    });
