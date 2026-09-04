import express from "express";
import {
	createRole,
	deleteRole,
	getRoleById,
	getRoles,
	updateRole,
} from "../controllers/roleController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
	"/roles",
	authMiddleware,
	requirePermission("roles.create"),
	getRoles,
);

router.get(
	"/roles/:id",
	authMiddleware,
	requirePermission("roles.create"),
	getRoleById,
);

router.post(
	"/roles",
	authMiddleware,
	requirePermission("roles.create"),
	createRole,
);

router.put(
	"/roles/:id",
	authMiddleware,
	requirePermission("roles.edit"),
	updateRole,
);

router.delete(
	"/roles/:id",
	authMiddleware,
	requirePermission("roles.delete"),
	deleteRole,
);

export default router;
