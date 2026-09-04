import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { getPeopleData } from "../controllers/zohoController.js";

const router = express.Router();

router.get(
  "/people",
  authMiddleware,
  requirePermission("zoho.people.view"),
  getPeopleData,
);

router.get(
  "/books",
  authMiddleware,
  requirePermission("zoho.books.view"),
  (req, res) => {
    res.json({
      success: true,
      message: "You have access to Zoho Books",
    });
  },
);

export default router;