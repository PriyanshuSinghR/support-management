import bcrypt from "bcryptjs";
import "dotenv/config";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import User from "./models/User.js";

const resetAdminPassword = async () => {
    try {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const password = process.env.ADMIN_PASSWORD;

        if (!email || !password || password.length < 12) {
            throw new Error(
                "Set ADMIN_EMAIL and a strong ADMIN_PASSWORD of at least 12 characters.",
            );
        }

        await connectDB();

        const user = await User.findOne({ email });

        if (!user) {
            throw new Error(
                `No account found for ${email}. Check the configured database and email.`,
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        user.password = hashedPassword;
        user.role = "ADMIN";
        user.isActive = true;

        await user.save();

        console.log(`Admin password reset successfully for ${email}`);
    } finally {
        await mongoose.disconnect();
    }
};

resetAdminPassword().catch((error) => {
    console.error("Password reset failed:", error.message);
    process.exitCode = 1;
});
