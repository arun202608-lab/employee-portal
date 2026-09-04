import ZohoToken from "../models/ZohoToken.js";
import { decryptToken, encryptToken } from "../utils/zohoCrypto.js";

const getZohoToken = async () => {
  const tokenRecord = await ZohoToken.findOne();

  if (!tokenRecord) {
    throw new Error("Zoho account is not connected");
  }

  // Access token is still valid
  if (new Date(tokenRecord.expiresAt).getTime() > Date.now() + 60000) {
    return {
      accessToken: decryptToken(tokenRecord.accessToken),
      apiDomain: tokenRecord.apiDomain,
    };
  }

  // Access token expired -> refresh it
  const refreshToken = decryptToken(tokenRecord.refreshToken);

  const response = await fetch(
    "https://accounts.zoho.com/oauth/v2/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.ZOHO_CLIENT_ID,
        client_secret: process.env.ZOHO_CLIENT_SECRET,
        grant_type: "refresh_token",
      }),
    },
  );

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    throw new Error("Failed to refresh Zoho access token");
  }

  const expiresAt = new Date(
    Date.now() + data.expires_in * 1000,
  );

  tokenRecord.accessToken = encryptToken(data.access_token);
  tokenRecord.expiresAt = expiresAt;

  if (data.api_domain) {
    tokenRecord.apiDomain = data.api_domain;
  }

  await tokenRecord.save();

  return {
    accessToken: data.access_token,
    apiDomain: tokenRecord.apiDomain,
  };
};

export const zohoRequest = async (endpoint, options = {}) => {
  const { accessToken, apiDomain } = await getZohoToken();

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${apiDomain}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  const responseText = await response.text();

  let data;

  try {
    data = JSON.parse(responseText);
  } catch {
    data = {
      rawResponse: responseText,
    };
  }

  if (!response.ok) {
    const error = new Error("Zoho API request failed");
    error.statusCode = response.status;
    error.data = data;
    throw error;
  }

  return data;
};