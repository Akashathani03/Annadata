import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Per the Database & Deployment sessions: bytes live outside MongoDB,
// the Message document only ever holds a reference/URL. This is the
// local-filesystem implementation of that - MVP-appropriate, and
// structured so that a future S3/Cloud Storage provider only needs to
// implement the same saveFile() contract (buffer + mimeType in,
// { url } out) to be a drop-in replacement. See index.js, the single
// point every service imports from.
const UPLOAD_DIR = path.resolve('uploads');

const EXTENSION_BY_MIME_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function saveFile(buffer, { mimeType }) {
  await ensureUploadDir();

  const extension = EXTENSION_BY_MIME_TYPE[mimeType] || 'bin';
  const filename = `${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.writeFile(filePath, buffer);

  // Relative path, not an absolute host+port URL - stays valid across
  // dev/staging/prod without baking in one environment's origin. app.js
  // serves this directory statically at the same /uploads prefix.
  return { url: `/uploads/${filename}` };
}
