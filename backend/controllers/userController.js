import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Role from "../models/Role.js";
import User from "../models/User.js";

const hasOwn = (object, property) =>
  Object.prototype.hasOwnProperty.call(object, property);

const validateRoles = async (roles) => {
  if (!Array.isArray(roles)) {
    const error = new Error("Roles must be an array");
    error.statusCode = 400;
    throw error;
  }

  const roleIds = [...new Set(roles.map((roleId) => String(roleId)))];
  if (roleIds.some((roleId) => !mongoose.isValidObjectId(roleId))) {
    const error = new Error("One or more role IDs are invalid");
    error.statusCode = 400;
    throw error;
  }

  const existingRoles = await Role.find({ _id: { $in: roleIds } }).select(
    "_id",
  );
  if (existingRoles.length !== roleIds.length) {
    const error = new Error("One or more roles do not exist");
    error.statusCode = 400;
    throw error;
  }

  return roleIds;
};

const sendError = (res, error, message) =>
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.statusCode ? error.message : message,
  });

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("roles");

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch users");
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("roles");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch user");
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, department, roles } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const roleIds = roles === undefined ? [] : await validateRoles(roles);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      department,
      roles: roleIds,
    });
    const safeUser = await User.findById(user._id)
      .select("-password")
      .populate("roles");

    return res.status(201).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    return sendError(res, error, "Failed to create user");
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, password, department, isActive, roles } =
      req.body || {};
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (hasOwn(req.body || {}, "name")) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }
      user.name = name.trim();
    }

    if (hasOwn(req.body || {}, "email")) {
      if (typeof email !== "string" || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: user._id },
      });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
      user.email = normalizedEmail;
    }

    if (hasOwn(req.body || {}, "department")) user.department = department;
    if (hasOwn(req.body || {}, "isActive")) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }

      user.isActive = isActive;
    }
    if (hasOwn(req.body || {}, "roles"))
      user.roles = await validateRoles(roles);
    if (hasOwn(req.body || {}, "password")) {
      if (typeof password !== "string" || !password) {
        return res.status(400).json({
          success: false,
          message: "Password cannot be empty",
        });
      }
      user.password = await bcrypt.hash(password, 10);
    }

    await user.save();
    const safeUser = await User.findById(user._id)
      .select("-password")
      .populate("roles");

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    return sendError(res, error, "Failed to update user");
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    return sendError(res, error, "Failed to delete user");
  }
};
