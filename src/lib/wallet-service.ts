import { Keypair } from '@solana/web3.js';
import * as CryptoJS from 'crypto-js';

export interface WalletData {
  id: string;
  name: string;
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: string;
}

export function encryptPrivateKey(privateKey: Uint8Array, password: string): string {
  const privateKeyHex = Buffer.from(privateKey).toString('hex');
  return CryptoJS.AES.encrypt(privateKeyHex, password).toString();
}

export function decryptPrivateKey(encryptedKey: string, password: string): Uint8Array {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, password);
    const privateKeyHex = decrypted.toString(CryptoJS.enc.Utf8);
    if (!privateKeyHex) {
      throw new Error('Invalid password');
    }
    return new Uint8Array(Buffer.from(privateKeyHex, 'hex'));
  } catch {
    throw new Error('Failed to decrypt private key. Wrong password?');
  }
}

export function generateSolanaWallet(name: string, password: string): WalletData {
  const keypair = Keypair.generate();
  const encryptedPrivateKey = encryptPrivateKey(keypair.secretKey, password);

  return {
    id: `wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    publicKey: keypair.publicKey.toBase58(),
    encryptedPrivateKey,
    createdAt: new Date().toISOString(),
  };
}

export function getAddressLast4(publicKey: string): string {
  return publicKey.slice(-4);
}
