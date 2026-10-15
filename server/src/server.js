import "dotenv/config";

import cors from "cors";
import express from "express";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import userRoutes from "./routes/user.routes.js";
const app = express();

app.use(
    cors({
        origin: process.env.CLIENT_URL,
    }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to the Support Management Portal API",
        status: "running",
        endpoints: {
            health: "/api/health",
            login: "/api/auth/login",
        },
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Support Management API is running",
    });
});

app.use("/api/auth", authRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/users", userRoutes);
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found.",
    });
});

const startServer = async () => {
    if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
        throw new Error("MONGODB_URI and JWT_SECRET must be configured.");
    }

    if (process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must contain at least 32 characters.");
    }

    await connectDB();

    const port = process.env.PORT || 5000;

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

startServer().catch((error) => {
    console.error("Server startup failed:", error.message);
    process.exit(1);
});
