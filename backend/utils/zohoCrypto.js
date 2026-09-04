import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

const encryptionKey = process.env.ZOHO_TOKEN_ENCRYPTION_KEY;

if (!encryptionKey) {
  throw new Error("ZOHO_TOKEN_ENCRYPTION_KEY is missing");
}

if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
  throw new Error(
    "ZOHO_TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters"
  );
}

const KEY = Buffer.from(encryptionKey, "hex");

export const encryptToken = (text) => {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

export const decryptToken = (encryptedText) => {
  const [ivHex, authTagHex, encryptedHex] = encryptedText.split(":");

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(ivHex, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};