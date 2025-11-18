import { Keypair } from '@solana/web3.js';
import * as CryptoJS from 'crypto-js';
import { SECURITY_CONFIG } from './security-config';

export interface WalletData {
  id: string;
  name: string;
  publicKey: string;
  encryptedPrivateKey: string;
  salt: string;
  iv: string;
  createdAt: string;
}

function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string');
  }
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return arr;
}

function generateRandomBytes(sizeInBytes: number): string {
  const randomWords = CryptoJS.lib.WordArray.random(sizeInBytes);
  return randomWords.toString(CryptoJS.enc.Hex);
}

function validatePrivateKey(privateKey: unknown): asserts privateKey is Uint8Array {
  if (!(privateKey instanceof Uint8Array)) {
    throw new Error('Private key must be Uint8Array');
  }
  if (privateKey.length !== SECURITY_CONFIG.PRIVATE_KEY_SIZE_BYTES) {
    throw new Error('Invalid private key format');
  }
}

function validatePassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string');
  }
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`);
  }
}

export function encryptPrivateKey(
  privateKey: Uint8Array,
  password: string,
): { encrypted: string; salt: string; iv: string } {
  validatePrivateKey(privateKey);
  validatePassword(password);

  try {
    const saltHex = generateRandomBytes(SECURITY_CONFIG.SALT_SIZE_BYTES);
    const ivHex = generateRandomBytes(SECURITY_CONFIG.IV_SIZE_BYTES);

    const saltWordArray = CryptoJS.enc.Hex.parse(saltHex);
    const ivWordArray = CryptoJS.enc.Hex.parse(ivHex);

    const key = CryptoJS.PBKDF2(password, saltWordArray, {
      keySize: SECURITY_CONFIG.KEY_SIZE_WORDS,
      iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    const privateKeyHex = uint8ArrayToHex(privateKey);

    const encrypted = CryptoJS.AES.encrypt(privateKeyHex, key, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();

    return {
      encrypted,
      salt: saltHex,
      iv: ivHex,
    };
  } catch {
    throw new Error('Failed to encrypt private key');
  }
}

export function decryptPrivateKey(
  encryptedKey: string,
  password: string,
  salt: string,
  iv: string,
): Uint8Array {
  validatePassword(password);
  if (!encryptedKey || !salt || !iv) {
    throw new Error('Missing required decryption parameters');
  }

  try {
    const saltWordArray = CryptoJS.enc.Hex.parse(salt);
    const ivWordArray = CryptoJS.enc.Hex.parse(iv);

    const key = CryptoJS.PBKDF2(password, saltWordArray, {
      keySize: SECURITY_CONFIG.KEY_SIZE_WORDS,
      iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
      hasher: CryptoJS.algo.SHA256,
    });

    const decrypted = CryptoJS.AES.decrypt(encryptedKey, key, {
      iv: ivWordArray,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const privateKeyHex = decrypted.toString(CryptoJS.enc.Utf8);

    if (!privateKeyHex || privateKeyHex.length === 0) {
      throw new Error('Decryption failed - wrong password?');
    }

    const expectedHexLength = SECURITY_CONFIG.PRIVATE_KEY_SIZE_BYTES * 2;
    if (privateKeyHex.length !== expectedHexLength) {
      throw new Error('Invalid decrypted key format');
    }

    return hexToUint8Array(privateKeyHex);
  } catch {
    throw new Error('Failed to decrypt private key. Wrong password?');
  }
}

export function generateSolanaWallet(name: string, password: string): WalletData {
  try {
    validatePassword(password);

    const keypair = Keypair.generate();
    const { encrypted, salt, iv } = encryptPrivateKey(keypair.secretKey, password);

    return {
      id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      publicKey: keypair.publicKey.toBase58(),
      encryptedPrivateKey: encrypted,
      salt,
      iv,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    throw new Error(
      `Failed to generate wallet: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export function getAddressLast4(publicKey: string): string {
  return publicKey.slice(-4);
}
