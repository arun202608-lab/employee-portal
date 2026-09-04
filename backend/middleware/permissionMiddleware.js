import Permission from "../models/Permission.js";
import Role from "../models/Role.js";

export const requirePermission = (permissionName) => async (req, res, next) => {
	try {
		if (!req.user || !Array.isArray(req.user.roles)) {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		const roles = await Role.find({
			_id: { $in: req.user.roles },
		}).select("permissions");
		const permissionIds = roles.flatMap((role) => role.permissions);

		const permission = await Permission.findOne({
			_id: { $in: permissionIds },
			name: permissionName,
			isActive: true,
		});

		if (!permission) {
			return res.status(403).json({
				success: false,
				message: "Access denied",
			});
		}

		return next();
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to verify permission",
		});
	}
};
