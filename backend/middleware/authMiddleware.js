import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

dotenv.config();

const authMiddleware = async (req, res, next) => {
	try {
		const authorization = req.headers.authorization;
		const [scheme, token] = authorization?.split(" ") || [];

		if (scheme !== "Bearer" || !token) {
			return res.status(401).json({
				success: false,
				message: "Authentication required",
			});
		}

		const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

		if (!decodedToken?.userId) {
			return res.status(401).json({
				success: false,
				message: "Invalid authentication token",
			});
		}

		const user = await User.findById(decodedToken.userId);

		if (!user || !user.isActive) {
			return res.status(401).json({
				success: false,
				message: "User is not authorized",
			});
		}

		req.user = user;
		return next();
	} catch (error) {
		if (
			error.name === "JsonWebTokenError" ||
			error.name === "TokenExpiredError" ||
			error.name === "CastError"
		) {
			return res.status(401).json({
				success: false,
				message: "Invalid authentication token",
			});
		}

		return res.status(500).json({
			success: false,
			message: "Authentication failed",
		});
	}
};

export default authMiddleware;
