import mongoose from "mongoose";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";

const hasOwn = (object, property) =>
	Object.prototype.hasOwnProperty.call(object, property);

const validatePermissions = async (permissions) => {
	if (!Array.isArray(permissions)) {
		const error = new Error("Permissions must be an array");
		error.statusCode = 400;
		throw error;
	}

	const permissionIds = [...new Set(permissions.map((permission) => String(permission)))];
	if (
		permissionIds.some((permissionId) => !mongoose.isValidObjectId(permissionId))
	) {
		const error = new Error("One or more permission IDs are invalid");
		error.statusCode = 400;
		throw error;
	}

	const existingPermissions = await Permission.find({
		_id: { $in: permissionIds },
	}).select("_id");

	if (existingPermissions.length !== permissionIds.length) {
		const error = new Error("One or more permissions do not exist");
		error.statusCode = 400;
		throw error;
	}

	return permissionIds;
};

const sendError = (res, error, message) => {
	const statusCode = error.code === 11000 ? 409 : error.statusCode || 500;
	const responseMessage =
		error.code === 11000 ? "Role name is already in use" : error.statusCode ? error.message : message;

	return res.status(statusCode).json({
		success: false,
		message: responseMessage,
	});
};

export const getRoles = async (req, res) => {
	try {
		const roles = await Role.find().populate("permissions");

		return res.status(200).json({
			success: true,
			roles,
		});
	} catch (error) {
		return sendError(res, error, "Failed to fetch roles");
	}
};

export const getRoleById = async (req, res) => {
	try {
		const role = await Role.findById(req.params.id).populate("permissions");

		if (!role) {
			return res.status(404).json({
				success: false,
				message: "Role not found",
			});
		}

		return res.status(200).json({
			success: true,
			role,
		});
	} catch (error) {
		return sendError(res, error, "Failed to fetch role");
	}
};

export const createRole = async (req, res) => {
	try {
		const { name, description, permissions } = req.body || {};

		if (typeof name !== "string" || !name.trim()) {
			return res.status(400).json({
				success: false,
				message: "Role name is required",
			});
		}

		const normalizedName = name.trim();
		const existingRole = await Role.findOne({ name: normalizedName });
		if (existingRole) {
			return res.status(409).json({
				success: false,
				message: "Role name is already in use",
			});
		}

		const permissionIds =
			permissions === undefined ? [] : await validatePermissions(permissions);
		const role = await Role.create({
			name: normalizedName,
			description,
			permissions: permissionIds,
		});
		const populatedRole = await Role.findById(role._id).populate("permissions");

		return res.status(201).json({
			success: true,
			role: populatedRole,
		});
	} catch (error) {
		return sendError(res, error, "Failed to create role");
	}
};

export const updateRole = async (req, res) => {
	try {
		const { name, description, permissions, isActive } = req.body || {};
		const role = await Role.findById(req.params.id);

		if (!role) {
			return res.status(404).json({
				success: false,
				message: "Role not found",
			});
		}

		if (hasOwn(req.body || {}, "name")) {
			if (typeof name !== "string" || !name.trim()) {
				return res.status(400).json({
					success: false,
					message: "Role name cannot be empty",
				});
			}

			const normalizedName = name.trim();
			const existingRole = await Role.findOne({
				name: normalizedName,
				_id: { $ne: role._id },
			});
			if (existingRole) {
				return res.status(409).json({
					success: false,
					message: "Role name is already in use",
				});
			}
			role.name = normalizedName;
		}

		if (hasOwn(req.body || {}, "description")) role.description = description;
		if (hasOwn(req.body || {}, "isActive")) {
			if (typeof isActive !== "boolean") {
				return res.status(400).json({
					success: false,
					message: "isActive must be a boolean",
				});
			}
			role.isActive = isActive;
		}
		if (hasOwn(req.body || {}, "permissions")) {
			role.permissions = await validatePermissions(permissions);
		}

		await role.save();
		const populatedRole = await Role.findById(role._id).populate("permissions");

		return res.status(200).json({
			success: true,
			role: populatedRole,
		});
	} catch (error) {
		return sendError(res, error, "Failed to update role");
	}
};

export const deleteRole = async (req, res) => {
	try {
		const role = await Role.findByIdAndDelete(req.params.id);

		if (!role) {
			return res.status(404).json({
				success: false,
				message: "Role not found",
			});
		}

		return res.status(200).json({
			success: true,
			message: "Role deleted successfully",
		});
	} catch (error) {
		return sendError(res, error, "Failed to delete role");
	}
};
