// Captcha generator — pure JS, no native deps
import crypto from 'crypto';

// In-memory store: sessionId -> { text, expiresAt }
const captchaStore = new Map<string, { text: string; expiresAt: number }>();

const TTL_MS = 5 * 60 * 1000; // 5 minutes
const CODE_LENGTH = 4;
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

function randomText(len: number): string {
  let result = '';
  for (let i = 0; i < len; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

// Generate a random noise SVG filter for the captcha
function noisePaths(width: number, height: number): string {
  let paths = '';
  // Random lines
  for (let i = 0; i < 5; i++) {
    const x1 = Math.floor(Math.random() * width);
    const y1 = Math.floor(Math.random() * height);
    const x2 = Math.floor(Math.random() * width);
    const y2 = Math.floor(Math.random() * height);
    const color = `hsl(${Math.floor(Math.random() * 360)}, 60%, 70%)`;
    paths += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1"/>`;
  }
  // Random dots
  for (let i = 0; i < 30; i++) {
    const cx = Math.floor(Math.random() * width);
    const cy = Math.floor(Math.random() * height);
    const r = Math.random() * 2;
    const color = `hsl(${Math.floor(Math.random() * 360)}, 50%, 80%)`;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" fill="${color}"/>`;
  }
  return paths;
}

function generateSVG(text: string, width: number, height: number): string {
  const charWidth = width / (text.length + 1);
  let chars = '';

  for (let i = 0; i < text.length; i++) {
    const x = charWidth * (i + 0.7) + (Math.random() - 0.5) * 10;
    const y = height * 0.55 + (Math.random() - 0.5) * 15;
    const rotation = (Math.random() - 0.5) * 30;
    const size = 24 + Math.floor(Math.random() * 8);
    const hue = Math.floor(Math.random() * 360);
    chars += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" font-weight="bold" font-family="Arial, sans-serif" fill="hsl(${hue}, 70%, 35%)" transform="rotate(${rotation.toFixed(1)}, ${x.toFixed(1)}, ${y.toFixed(1)})">${text[i]}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="hsl(${Math.floor(Math.random() * 360)}, 20%, 95%)"/>
    ${noisePaths(width, height)}
    ${chars}
  </svg>`;
}

function svgToBase64(svg: string): string {
  const buf = Buffer.from(svg, 'utf-8');
  return `data:image/svg+xml;base64,${buf.toString('base64')}`;
}

export interface CaptchaResponse {
  sessionId: string;
  image: string; // base64 data URL
}

export function createCaptcha(): CaptchaResponse {
  const sessionId = crypto.randomUUID();
  const text = randomText(CODE_LENGTH);

  captchaStore.set(sessionId, { text, expiresAt: Date.now() + TTL_MS });

  // Clean up expired entries periodically
  if (captchaStore.size > 1000) {
    const now = Date.now();
    for (const [key, val] of captchaStore) {
      if (val.expiresAt < now) captchaStore.delete(key);
    }
  }

  const svg = generateSVG(text, 160, 50);
  return { sessionId, image: svgToBase64(svg) };
}

export function verifyCaptcha(sessionId: string, userInput: string): boolean {
  const entry = captchaStore.get(sessionId);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    captchaStore.delete(sessionId);
    return false;
  }
  // Case-insensitive comparison
  const valid = entry.text.toLowerCase() === userInput.toLowerCase();
  captchaStore.delete(sessionId); // One-time use
  return valid;
}
