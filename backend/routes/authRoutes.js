import express from "express";
import { getMe, login, register } from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getMe);

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Auth route is working",
  });
});
export default router;
