import dotenv from "dotenv";
import mongoose from "mongoose";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
// DELETE THIS
import User from "../models/User.js"; 

dotenv.config();

const permissionNames = [
	"zoho.people.view",
	"zoho.crm.view",
	"zoho.desk.view",
	"zoho.books.view",
	"users.create",
	"users.edit",
	"users.delete",
	"roles.create",
	"roles.edit",
	"roles.delete",
	"permissions.manage",
	"auditlogs.view",
];

const rolePermissions = {
	Admin: permissionNames,
	HR: ["zoho.people.view"],
	Sales: ["zoho.crm.view"],
	Support: ["zoho.desk.view"],
	Finance: ["zoho.books.view"],
};

const seed = async () => {
	await mongoose.connect(process.env.MONGO_URI);

	const permissions = {};

	for (const name of permissionNames) {
		const separatorIndex = name.lastIndexOf(".");
		const permission = await Permission.findOneAndUpdate(
			{ name },
			{
				$set: {
					resource: name.slice(0, separatorIndex),
					action: name.slice(separatorIndex + 1),
					isActive: true,
				},
				$setOnInsert: { name },
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true },
		);

		permissions[name] = permission._id;
	}

	for (const [name, names] of Object.entries(rolePermissions)) {
		await Role.findOneAndUpdate(
			{ name },
			{
				$set: {
					permissions: names.map((permissionName) => permissions[permissionName]),
					isActive: true,
				},
				$setOnInsert: { name },
			},
			{ new: true, upsert: true, setDefaultsOnInsert: true },
		);
	}

	console.log("Database seeded successfully");
};

try {
	await seed();
} catch (error) {
	console.error("Database seeding failed:", error.message);
	process.exitCode = 1;
} finally {
	await mongoose.connection.close();
}
