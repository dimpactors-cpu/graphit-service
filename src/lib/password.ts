import crypto from "crypto";

const PBKDF2_ITERATIONS = 12000;
const PBKDF2_SALT_BYTES = 24;
const PBKDF2_HASH_BYTES = 24;

/**
 * Generates a Gnuboard 5 compatible PBKDF2 hash:
 * Format: sha256:12000:<base64_salt>:<base64_hash>
 */
export function createHash(password: string): string {
  const salt = crypto.randomBytes(PBKDF2_SALT_BYTES).toString("base64");
  const derived = crypto.pbkdf2Sync(
    Buffer.from(password, "utf-8"),
    Buffer.from(salt, "utf-8"),
    PBKDF2_ITERATIONS,
    PBKDF2_HASH_BYTES,
    "sha256"
  );
  return `sha256:${PBKDF2_ITERATIONS}:${salt}:${derived.toString("base64")}`;
}

/**
 * Validates a plaintext password against a Gnuboard 5 PBKDF2 hash or MySQL PASSWORD() hash
 */
export function validatePassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;

  // Gnuboard 5 PBKDF2 format: sha256:12000:salt:hash
  if (storedHash.includes(":")) {
    const parts = storedHash.split(":");
    if (parts.length >= 4) {
      const algo = parts[0].toLowerCase();
      const iterations = parseInt(parts[1], 10);
      const salt = parts[2];
      const expectedBytes = Buffer.from(parts[3], "base64");
      try {
        const derived = crypto.pbkdf2Sync(
          Buffer.from(password, "utf-8"),
          Buffer.from(salt, "utf-8"),
          iterations,
          expectedBytes.length,
          algo === "sha1" ? "sha1" : "sha256"
        );
        if (derived.length === expectedBytes.length && crypto.timingSafeEqual(derived, expectedBytes)) {
          return true;
        }
      } catch {
        return false;
      }
    }
  }

  // MySQL 4.1+ PASSWORD() format: * + 40 hex chars
  if (storedHash.startsWith("*") && storedHash.length === 41) {
    const sha1First = crypto.createHash("sha1").update(password, "utf-8").digest();
    const sha1Second = "*" + crypto.createHash("sha1").update(sha1First).digest("hex").toUpperCase();
    if (sha1Second === storedHash.toUpperCase()) {
      return true;
    }
  }

  // Plaintext fallback (for newly created test accounts if stored unhashed)
  if (storedHash === password) {
    return true;
  }

  return false;
}
