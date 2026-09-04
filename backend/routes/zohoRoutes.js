import express from "express";
import ZohoToken from "../models/ZohoToken.js";
import { encryptToken } from "../utils/zohoCrypto.js";
const router = express.Router();

router.get("/connect", (req, res) => {
  const authUrl =
    `https://accounts.zoho.com/oauth/v2/auth?` +
    new URLSearchParams({
      response_type: "code",
      client_id: process.env.ZOHO_CLIENT_ID,
      scope: "ZOHOPEOPLE.forms.READ",
      redirect_uri: process.env.ZOHO_REDIRECT_URI,
      access_type: "offline",
      prompt: "consent",
    }).toString();

  res.redirect(authUrl);
});

router.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Authorization code not received",
      });
    }

    const tokenResponse = await fetch(
      "https://accounts.zoho.com/oauth/v2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          redirect_uri: process.env.ZOHO_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(tokenResponse.status).json({
        success: false,
        message: "Failed to exchange authorization code",
        error: tokenData,
      });
    }

    const expiresAt = new Date(
      Date.now() + tokenData.expires_in * 1000,
    );

    await ZohoToken.deleteMany({});

    await ZohoToken.create({
      accessToken: encryptToken(tokenData.access_token),
      refreshToken: encryptToken(tokenData.refresh_token),
      apiDomain: tokenData.api_domain,
      tokenType: tokenData.token_type,
      expiresAt,
    });

    return res.json({
      success: true,
      message: "Zoho connected successfully",
    });
  } catch (error) {
    console.error("Zoho OAuth Error:", error);

    return res.status(500).json({
      success: false,
      message: "Zoho OAuth failed",
    });
  }
});

export default router;