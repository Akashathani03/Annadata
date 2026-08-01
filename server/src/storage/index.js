import * as localFilesystemStorage from './localFilesystemStorage.js';

// Every service imports storageProvider from here, never a specific
// provider file directly. Swapping to S3/Cloud Storage later means
// adding a new provider file (implementing the same saveFile(buffer,
// { mimeType }) -> { url } contract) and changing this one line - no
// service that already calls storageProvider.saveFile() needs to
// change at all.
export const storageProvider = localFilesystemStorage;
