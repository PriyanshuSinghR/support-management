import { Router } from "express";

import authenticate from "../middleware/authenticate.js";
import authorize from "../middleware/authorize.js";

import {
    changeMyPassword,
    createUser,
    getMyProfile,
    getUsers,
    resetUserPassword,
    updateMyProfile,
    updateUser,
} from "../controllers/user.controller.js";

const router = Router();

// All endpoints require authentication.
router.use(authenticate);

// Profile endpoints: available to authenticated users.
router.get("/me", getMyProfile);
router.patch("/me", updateMyProfile);
router.patch("/me/password", changeMyPassword);

// User management: Admin only.
router.use(authorize("ADMIN"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.patch("/:id/password", resetUserPassword);

export default router;
