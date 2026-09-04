import AuditLog from "../models/AuditLog.js";

const getAction = (method) => {
	switch (method) {
		case "GET":
			return "view";
		case "POST":
			return "create";
		case "PUT":
		case "PATCH":
			return "edit";
		case "DELETE":
			return "delete";
		default:
			return method.toLowerCase();
	}
};

const getResource = (endpoint) => {
	const segments = endpoint.split("?")[0].split("/").filter(Boolean);
	return segments.find((segment) => segment.toLowerCase() !== "api");
};

const auditMiddleware = (req, res, next) => {
	const method = req.method.toUpperCase();
	const endpoint = req.originalUrl;

	res.once("finish", async () => {
		try {
			const userId = req.user?._id || req.user?.id;

			await AuditLog.create({
				user: userId,
				action: getAction(method),
				resource: getResource(endpoint),
				method,
				endpoint,
				statusCode: res.statusCode,
				ipAddress: req.ip,
				userAgent: req.get("user-agent"),
			});
		} catch (error) {
			console.error("Audit logging failed:", error.message);
		}
	});

	next();
};

export default auditMiddleware;
