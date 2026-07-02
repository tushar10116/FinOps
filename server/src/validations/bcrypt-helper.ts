import crypto from "crypto";

const IV_LENGTH = 12; // Standard initialization vector length for GCM
const AUTH_TAG_LENGTH = 16; // Standard authentication tag length for GCM

/**
 * Dynamically resolves the 32-byte key buffer from process.env at runtime.
 * This guarantees execution safely after dotenv initializes.
 */
function getKeyBuffer(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("CRITICAL CONFIGURATION ERROR: process.env.ENCRYPTION_KEY is completely missing at runtime.");
  }
  // Hash the key to exactly 32 bytes to support keys of any textual length safely
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @returns Delimited format -> iv_hex:auth_tag_hex:ciphertext_hex
 */
export const encryptSecret = (text: string): string => {
  if (!text) return "";
  try {
    const keyBuffer = getKeyBuffer();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);
    
    let encrypted = cipher.update(text, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    const authTag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
  } catch (error: any) {
    console.error("[CRYPTO ERROR] Encryption failed:", error.message);
    throw new Error(`Symmetric encryption failure: ${error.message}`);
  }
};

/**
 * Decrypts an AES-256-GCM encrypted string back to UTF-8 plaintext.
 * Strictly verifies the integrity tag to catch database trimming/truncation.
 */
/**
 * Decrypts an AES-256-GCM encrypted string back to UTF-8 plaintext.
 * Strictly verifies the integrity tag to catch database trimming/truncation.
 */
export const decryptSecret = (encryptedPayload: string): string => {
  if (!encryptedPayload) return "";
  
  const parts = encryptedPayload.split(":");
  // GCM requires exactly 3 segments: [IV, AuthTag, Ciphertext]
  if (parts.length !== 3) {
    console.warn("[CRYPTO WARN] Invalid or legacy ciphertext format detected. Skipping decryption.");
    return encryptedPayload;
  }

  // Extract explicit variables to guarantee definitions to the TypeScript compiler
  const ivHex = parts[0];
  const authTagHex = parts[1];
  const ciphertextHex = parts[2];

  // Defensive validation: explicit type guards check to eliminate `string | undefined` issues
  if (typeof ivHex !== "string" || typeof authTagHex !== "string" || typeof ciphertextHex !== "string") {
    console.error("[CRYPTO ERROR] Malformed token layout strings detected.");
    throw new Error("Secure payload decryption failed due to incomplete token segments.");
  }

  try {
    const keyBuffer = getKeyBuffer();
    
    // TypeScript is now 100% satisfied because type guards proved these are strictly primitive strings
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString("utf8");
  } catch (error: any) {
    console.error("[CRYPTO ERROR] Decryption failed! The data was corrupted or the key is wrong:", error.message);
    throw new Error("Secure payload decryption failed due to an authentication tag mismatch.");
  }
};