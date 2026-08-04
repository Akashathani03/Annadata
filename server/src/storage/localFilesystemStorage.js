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

const MIME_TYPE_BY_EXTENSION = Object.fromEntries(
  Object.entries(EXTENSION_BY_MIME_TYPE).map(([mime, ext]) => [ext, mime])
);

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

// Reads a previously saved file back into memory - needed when a
// stored photo (e.g. a crop photo attached to a farmer's message)
// needs to be sent to Gemini for diagnosis. The Message model only
// stores the URL, never the mime type, so it's inferred from the file
// extension - the same mapping saveFile used to choose that extension
// in the first place, just applied in reverse.
export async function readFile(url) {
  const filename = path.basename(url);
  const filePath = path.join(UPLOAD_DIR, filename);
  const buffer = await fs.readFile(filePath);
  const extension = path.extname(filename).slice(1);
  const mimeType = MIME_TYPE_BY_EXTENSION[extension] || 'application/octet-stream';
  return { buffer, mimeType };
}
