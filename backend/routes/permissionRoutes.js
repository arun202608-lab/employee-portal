import express from "express";
import {
	createPermission,
	deletePermission,
	getPermissionById,
	getPermissions,
	updatePermission,
} from "../controllers/permissionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
	"/permissions",
	authMiddleware,
	requirePermission("permissions.manage"),
	getPermissions,
);

router.get(
	"/permissions/:id",
	authMiddleware,
	requirePermission("permissions.manage"),
	getPermissionById,
);

router.post(
	"/permissions",
	authMiddleware,
	requirePermission("permissions.manage"),
	createPermission,
);

router.put(
	"/permissions/:id",
	authMiddleware,
	requirePermission("permissions.manage"),
	updatePermission,
);

router.delete(
	"/permissions/:id",
	authMiddleware,
	requirePermission("permissions.manage"),
	deletePermission,
);

export default router;
