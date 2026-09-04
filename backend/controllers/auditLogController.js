import mongoose from "mongoose";
import AuditLog from "../models/AuditLog.js";

const validateAuditLogId = (id) => {
	if (!mongoose.isValidObjectId(id)) {
		const error = new Error("Invalid audit log ID");
		error.statusCode = 400;
		throw error;
	}
};

const sendError = (res, error, message) =>
	res.status(error.statusCode || 500).json({
		success: false,
		message: error.statusCode ? error.message : message,
	});

const populateUser = (query) => query.populate("user", "name email");

export const getAuditLogs = async (req, res) => {
	try {
		const logs = await populateUser(
			AuditLog.find().sort({ createdAt: -1 }),
		);

		return res.status(200).json({
			success: true,
			logs,
		});
	} catch (error) {
		return sendError(res, error, "Failed to fetch audit logs");
	}
};

export const getAuditLogById = async (req, res) => {
	try {
		validateAuditLogId(req.params.id);
		const log = await populateUser(AuditLog.findById(req.params.id));

		if (!log) {
			return res.status(404).json({
				success: false,
				message: "Audit log not found",
			});
		}

		return res.status(200).json({
			success: true,
			log,
		});
	} catch (error) {
		return sendError(res, error, "Failed to fetch audit log");
	}
};
