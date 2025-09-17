import { SecretKey } from '@/constants';
import CryptoJS from 'crypto-js';

export const getSecondTimestamp = () => {
  return Math.floor(Date.now() / 1000);
};

// 简单的哈希函数
export const simpleHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

// 基础nonce生成 - 生成24位随机字符串(字母和数字组成)
export const generateNonce = () => {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateSignature = ({
  nonce,
  timestamp,
}: {
  nonce: string;
  timestamp: string;
}) => {
  const message = `timestamp:${timestamp}-nonce:${nonce}`;
  const hmac = CryptoJS.HmacSHA256(message, SecretKey);
  return hmac.toString(CryptoJS.enc.Hex);
};
