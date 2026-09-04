import express from "express";
import {
	getAuditLogById,
	getAuditLogs,
} from "../controllers/auditLogController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get(
	"/logs",
	authMiddleware,
	requirePermission("auditlogs.view"),
	getAuditLogs,
);

router.get(
	"/logs/:id",
	authMiddleware,
	requirePermission("auditlogs.view"),
	getAuditLogById,
);

export default router;
