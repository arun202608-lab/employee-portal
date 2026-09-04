import mongoose from "mongoose";
import Permission from "../models/Permission.js";

const hasOwn = (object, property) =>
	Object.prototype.hasOwnProperty.call(object, property);

const validatePermissionId = (id) => {
	if (!mongoose.isValidObjectId(id)) {
		const error = new Error("Invalid permission ID");
		error.statusCode = 400;
		throw error;
	}
};

const sendError = (res, error, message) => {
	const statusCode = error.code === 11000 ? 409 : error.statusCode || 500;
	const responseMessage =
		error.code === 11000
			? "Permission name is already in use"
			: error.statusCode
				? error.message
				: message;

	return res.status(statusCode).json({
		success: false,
		message: responseMessage,
	});
};

export const getPermissions = async (req, res) => {
	try {
		const permissions = await Permission.find();

		return res.status(200).json({
			success: true,
			permissions,
		});
	} catch (error) {
		return sendError(res, error, "Failed to fetch permissions");
	}
};

export const getPermissionById = async (req, res) => {
	try {
		validatePermissionId(req.params.id);
		const permission = await Permission.findById(req.params.id);

		if (!permission) {
			return res.status(404).json({
				success: false,
				message: "Permission not found",
			});
		}

		return res.status(200).json({
			success: true,
			permission,
		});
	} catch (error) {
		return sendError(res, error, "Failed to fetch permission");
	}
};

export const createPermission = async (req, res) => {
	try {
		const { name, description, resource, action } = req.body || {};

		if (typeof name !== "string" || !name.trim()) {
			return res.status(400).json({
				success: false,
				message: "Permission name is required",
			});
		}

		const normalizedName = name.trim();
		const existingPermission = await Permission.findOne({
			name: normalizedName,
		});
		if (existingPermission) {
			return res.status(409).json({
				success: false,
				message: "Permission name is already in use",
			});
		}

		const permission = await Permission.create({
			name: normalizedName,
			description,
			resource,
			action,
		});

		return res.status(201).json({
			success: true,
			permission,
		});
	} catch (error) {
		return sendError(res, error, "Failed to create permission");
	}
};

export const updatePermission = async (req, res) => {
	try {
		validatePermissionId(req.params.id);
		const permission = await Permission.findById(req.params.id);

		if (!permission) {
			return res.status(404).json({
				success: false,
				message: "Permission not found",
			});
		}

		const { name, description, resource, action, isActive } = req.body || {};

		if (hasOwn(req.body || {}, "name")) {
			if (typeof name !== "string" || !name.trim()) {
				return res.status(400).json({
					success: false,
					message: "Permission name cannot be empty",
				});
			}

			const normalizedName = name.trim();
			const existingPermission = await Permission.findOne({
				name: normalizedName,
				_id: { $ne: permission._id },
			});
			if (existingPermission) {
				return res.status(409).json({
					success: false,
					message: "Permission name is already in use",
				});
			}
			permission.name = normalizedName;
		}

		if (hasOwn(req.body || {}, "description")) permission.description = description;
		if (hasOwn(req.body || {}, "resource")) permission.resource = resource;
		if (hasOwn(req.body || {}, "action")) permission.action = action;
		if (hasOwn(req.body || {}, "isActive")) {
			if (typeof isActive !== "boolean") {
				return res.status(400).json({
					success: false,
					message: "isActive must be a boolean",
				});
			}
			permission.isActive = isActive;
		}

		await permission.save();

		return res.status(200).json({
			success: true,
			permission,
		});
	} catch (error) {
		return sendError(res, error, "Failed to update permission");
	}
};

export const deletePermission = async (req, res) => {
	try {
		validatePermissionId(req.params.id);
		const permission = await Permission.findByIdAndDelete(req.params.id);

		if (!permission) {
			return res.status(404).json({
				success: false,
				message: "Permission not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Permission deleted successfully",
		});
	} catch (error) {
		return sendError(res, error, "Failed to delete permission");
	}
};
