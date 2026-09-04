import dotenv from "dotenv";
import mongoose from "mongoose";
import Role from "../models/Role.js";
import User from "../models/User.js";

dotenv.config();

const assignAdminRole = async () => {
	await mongoose.connect(process.env.MONGO_URI);

	const user = await User.findOne({ email: "admin@example.com" });
	if (!user) {
		throw new Error('User with email "admin@example.com" not found');
	}

	const adminRole = await Role.findOne({ name: "Admin" });
	if (!adminRole) {
		throw new Error('Role with name "Admin" not found');
	}

	const userRoles = user.roles || [];
	const hasAdminRole = userRoles.some(
		(roleId) => roleId.toString() === adminRole._id.toString(),
	);

	if (!hasAdminRole) {
		user.roles = [...userRoles, adminRole._id];
		await user.save();
	}

	console.log(
		hasAdminRole
			? "Admin role is already assigned to admin@example.com"
			: "Admin role assigned successfully to admin@example.com",
	);
};

try {
	await assignAdminRole();
} catch (error) {
	console.error("Failed to assign Admin role:", error.message);
	process.exitCode = 1;
} finally {
	await mongoose.connection.close();
}
