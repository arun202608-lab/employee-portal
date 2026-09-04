import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const encryptionKey = process.env.ZOHO_TOKEN_ENCRYPTION_KEY;

if (!encryptionKey) {
  throw new Error("ZOHO_TOKEN_ENCRYPTION_KEY is missing");
}

if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
  throw new Error("ZOHO_TOKEN_ENCRYPTION_KEY must be 64 hex characters");
}

const KEY = Buffer.from(encryptionKey, "hex");