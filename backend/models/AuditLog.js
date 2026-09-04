import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false,
		},
		action: {
			type: String,
			required: true,
			trim: true,
		},
		resource: {
			type: String,
			trim: true,
		},
		method: {
			type: String,
			trim: true,
		},
		endpoint: {
			type: String,
			trim: true,
		},
		statusCode: {
			type: Number,
		},
		ipAddress: {
			type: String,
			trim: true,
		},
		userAgent: {
			type: String,
			trim: true,
		},
		details: {
			type: String,
			trim: true,
		},
	},
	{
		timestamps: true,
	},
);

export default mongoose.model("AuditLog", auditLogSchema);
