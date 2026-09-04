import mongoose from "mongoose";

const roleSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		description: {
			type: String,
			trim: true,
		},
		permissions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Permission",
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

export default mongoose.model("Role", roleSchema);
