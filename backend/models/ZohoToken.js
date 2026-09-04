import mongoose from "mongoose";

const zohoTokenSchema = new mongoose.Schema(
  {
    accessToken: {
      type: String,
      required: true,
    },

    refreshToken: {
      type: String,
      required: true,
    },

    apiDomain: {
      type: String,
      required: true,
    },

    tokenType: {
      type: String,
      default: "Bearer",
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("ZohoToken", zohoTokenSchema);