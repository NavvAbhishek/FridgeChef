const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Derives a key from the encryption secret using PBKDF2
 * @param {string} secret - The encryption secret from environment
 * @param {Buffer} salt - Salt for key derivation
 * @returns {Buffer} - Derived key
 */
const deriveKey = (secret, salt) => {
  return crypto.pbkdf2Sync(secret, salt, ITERATIONS, KEY_LENGTH, 'sha256');
};

/**
 * Encrypts sensitive data (like API keys)
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: salt:iv:authTag:encryptedData
 */
const encrypt = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid input for encryption');
    }

    if (!process.env.ENCRYPTION_SECRET) {
      throw new Error('ENCRYPTION_SECRET is not set in environment variables');
    }

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from encryption secret
    const key = deriveKey(process.env.ENCRYPTION_SECRET, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: salt:iv:authTag:encryptedData
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypts encrypted data
 * @param {string} encryptedText - Encrypted text in format: salt:iv:authTag:encryptedData
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedText) => {
  try {
    if (!encryptedText || typeof encryptedText !== 'string') {
      throw new Error('Invalid input for decryption');
    }

    if (!process.env.ENCRYPTION_SECRET) {
      throw new Error('ENCRYPTION_SECRET is not set in environment variables');
    }

    // Split the encrypted text into components
    const parts = encryptedText.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    // Derive key from encryption secret
    const key = deriveKey(process.env.ENCRYPTION_SECRET, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the text
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw new Error('Failed to decrypt data');
  }
};

/**
 * Validates if a string is properly encrypted
 * @param {string} text - Text to validate
 * @returns {boolean} - True if valid encrypted format
 */
const isEncrypted = (text) => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  const parts = text.split(':');
  return parts.length === 4;
};

module.exports = {
  encrypt,
  decrypt,
  isEncrypted
};
