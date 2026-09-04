import express from "express";
import {
	createUser,
	deleteUser,
	getUserById,
	getUsers,
	updateUser,
} from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
	"/users",
	authMiddleware,
	requirePermission("users.create"),
	getUsers,
);

router.get(
	"/users/:id",
	authMiddleware,
	requirePermission("users.create"),
	getUserById,
);

router.post(
	"/users",
	authMiddleware,
	requirePermission("users.create"),
	createUser,
);

router.put(
	"/users/:id",
	authMiddleware,
	requirePermission("users.edit"),
	updateUser,
);

router.delete(
	"/users/:id",
	authMiddleware,
	requirePermission("users.delete"),
	deleteUser,
);

export default router;
